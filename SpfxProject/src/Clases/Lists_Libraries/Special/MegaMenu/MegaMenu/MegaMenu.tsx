/* eslint-disable @typescript-eslint/no-var-requires */
import {
    CommandBar,
    FocusTrapZone,
    ICommandBarItemProps,
    IconButton,
    PanelType,
    SearchBox,
    Stack,
    StackItem,
} from "@fluentui/react";
import { MegaMenuItem } from "../MegaMenuItem";

import { SPFI } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { MegaMenuNode, MegaMenuStructure } from "./MegaMenuStructure";
import MegaMenuList from "../MegaMenuList";
import ShowErrors from "../../../../../Components/Basics/ShowError/ShowError";
import GroupsSP from "../../../../Tools/Groups/Groups";
import MegaMenuStyles from "./MegaMenu.module.scss";

import { IFramePanel } from "@pnp/spfx-controls-react";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import MyLinksList from "../../../MyLinks/MyLinksList";
import { MyLinksItem } from "../../../MyLinks/MyLinksItem";
import { Item } from "@pnp/sp/items";
import { IWeb } from "@pnp/sp/webs";
import MegaMenuParametersList from "../../../MegaMenuParameters/MegaMenuParametersList";
import { MegaMenuParametersItem } from "../../../MegaMenuParameters/MegaMenuParametersItem";
import Marquee from "react-smooth-marquee";
import ErrorBoundary from "../../../../../Components/Basics/ErrorBound/ErrorBound";
const Logo = require("../../../../../Logo/INLogo.png");

export interface MegaMenuProps {
    Web: IWeb;
    Context: WebPartContext | ApplicationCustomizerContext;
}

const ComponentName = "MegaMenu";

/**
 * Renders megamenu
 * @param props
 * @returns
 */
export default function MegaMenu(props: MegaMenuProps) {
    const [MegaMenuItems, setMegaMenuItems] = useState<MegaMenuItem[]>(null);
    const [Errors, setErrors] = useState<string[]>([]);
    const MyLinksL = useRef<MyLinksList>(null);
    const MegaMenuListRef = useRef<MegaMenuList>(null);
    const [MegaMenuStructure, setMegaMenuStructure] =
        useState<MegaMenuStructure>(null);
    const MegaMenuParametersL = useRef<MegaMenuParametersList>(null);
    const SPGroups = useRef<GroupsSP>(null);
    const [Ready, setReady] = useState(false);

    const [MyLinksEditMode, setMyLinksEditMode] = useState(false);
    const [MyLinks, setMyLinks] = useState<MyLinksItem[]>([]);
    const [MegaMenuParameters, setMegaMenuParameters] =
        useState<MegaMenuParametersItem[]>(null);
    const [Open, setOpen] = useState(false);

    const [Loading, setLoading] = useState(false);

    const [ExpandedElements, setExpandedElements] = useState<{
        [Key: string]: any;
    }>({});

    useEffect(() => {
        initialLoad().catch((Ex) => {
            setErrors([...Errors, Ex.message]);
        });
    }, []);

    const LoadData = async () => {
        try {
            setLoading(true);

            const [BatchedWeb, Execute] = props.Web.batched();

            let MyLinks = MyLinksL.current.GetMyQueries();
            let MegaMenuStructure = MegaMenuListRef.current
                .LoadMegaMenu()
                .catch((Ex) => {
                    throw Ex;
                });
            let MegaMenuP = MegaMenuParametersL.current.GetAll();
            await Execute();

            setMegaMenuStructure(await MegaMenuStructure);
            setMyLinks(await MyLinks);
            setMegaMenuParameters(await MegaMenuP);
            setReady(true);
            setLoading(false);
        } catch (Ex) {
            setErrors([...Errors, Ex.message]);
        }
        setLoading(false);
    };

    async function initialLoad() {
        try {
            SPGroups.current = GroupsSP.getInstance(props.Web, props.Context);

            MegaMenuListRef.current = new MegaMenuList(
                props.Web,
                props.Context
            );
            MyLinksL.current = new MyLinksList(props.Web, props.Context);
            MegaMenuParametersL.current = new MegaMenuParametersList(
                props.Web,
                props.Context
            );

            await SPGroups.current.IsLoaded;
            if (SPGroups.current.LoadingError != null)
                throw SPGroups.current.LoadingError;
            await LoadData();
        } catch (Ex) {
            setErrors([...Errors, Ex.message]);
        }
    }

    /*
        Custom MegaMenu fuctions
    */

    /**
     *
     * @param MN Handles on click events on mega menu node
     *
     */
    const RenderOnclick = (MN: MegaMenuNode) => {
        if (MN.Item.Link != "") window.open(MN.Item.Link, "_blank");
    };

    /**
     * Filters mega menu nodes where the user is not part of the indicated group
     * @param MN
     * @returns returns true if group is null or user is part of the group
     */
    const FilterNodeGroups = (MN: MegaMenuNode) => {
        if (MN.Group != null && MN.Group.length > 0) {
            let GroupsImInsideOf = MN.Group.filter((G) =>
                SPGroups.current.CheckGroup(G.Title)
            );

            if (GroupsImInsideOf.length <= 0) return false;
        }
        return true;
    };

    /**
     * Sorts mega menu nodes
     * @param MN
     * @param MN2
     * @returns
     */
    const SortNodeGroups = (MN: MegaMenuNode, MN2: MegaMenuNode) => {
        if (MN.Position < MN2.Position) return -1;
        else return 1;
    };

    const GetNodes = (MN: MegaMenuNode): MegaMenuNode[] => {
        return MN.SubNodes && MN.SubNodes.length > 0
            ? MN.SubNodes.filter(FilterNodeGroups)
                  .sort(SortNodeGroups)
                  .map((N) => N)
            : [];
    };

    const ExpandNode = (ID: number) => {
        if (ExpandedElements[ID] == null) {
            let Nodes = { ...ExpandedElements };
            Nodes[ID] = true;
            setExpandedElements(Nodes);
        }
    };
    const RetractNode = (ID: number) => {
        if (ExpandedElements[ID] != null) {
            let Nodes = { ...ExpandedElements };
            delete Nodes[ID];
            setExpandedElements(Nodes);
        }
    };

    const RenderSubNode = (N: MegaMenuNode, Depth: number) => {
        let Padding = Depth > 1 ? Depth * 15 : 0;

        let SubNodes = GetNodes(N);

        return N.Item.Link != "" ? (
            <>
                <div
                    className={MegaMenuStyles.LinkText}
                    style={{ paddingLeft: Padding }}
                >
                    <a
                        href={N.Item.Link}
                        onClick={() => {
                            setOpen(false);
                        }}
                        onAuxClick={() => {
                            setOpen(false);
                        }}
                    >
                        {N.Title}
                    </a>
                    {SubNodes.length > 0 && (
                        <IconButton
                            iconProps={{
                                iconName:
                                    ExpandedElements[N.Item.ID] != null
                                        ? "ChevronLeft"
                                        : "ChevronRight",
                            }}
                            onClick={() => {
                                if (ExpandedElements[N.Item.ID] == null) {
                                    ExpandNode(N.Item.ID);
                                } else {
                                    RetractNode(N.Item.ID);
                                }
                            }}
                        ></IconButton>
                    )}
                </div>
                {ExpandedElements[N.Item.ID] != null &&
                    SubNodes?.map((N) => {
                        return RenderSubNode(N, Depth + 1);
                    })}
            </>
        ) : (
            <>
                <div
                    className={MegaMenuStyles.LinkText}
                    style={{ paddingLeft: Padding }}
                >
                    {N.Title}
                    {SubNodes.length > 0 && (
                        <IconButton
                            iconProps={{
                                iconName:
                                    ExpandedElements[N.Item.ID] != null
                                        ? "ChevronLeft"
                                        : "ChevronRight",
                            }}
                            onClick={() => {
                                if (ExpandedElements[N.Item.ID] == null) {
                                    ExpandNode(N.Item.ID);
                                } else {
                                    RetractNode(N.Item.ID);
                                }
                            }}
                        ></IconButton>
                    )}
                </div>

                {ExpandedElements[N.Item.ID] != null &&
                    SubNodes?.map((N) => {
                        return RenderSubNode(N, Depth + 1);
                    })}
            </>
        );
    };

    /**
     * Renders MegaMenuNode and all its children
     * @param MN
     * @returns
     */
    const _RenderMegaMenuNode = (MN: MegaMenuNode): JSX.Element => {
        let SubNodes = GetNodes(MN);

        let Depth = 1;

        let MyLinksSorted = MyLinks.sort((a, b) => {
            let SortValueA: number = a.LinkOrder != -1 ? a.LinkOrder : a.ID;
            let sortValueB: number = b.LinkOrder != -1 ? b.LinkOrder : a.ID;
            return SortValueA > sortValueB ? 1 : -1;
        });
        let IsMyLinks = MN.Item.CustomFunction == "MyLinks";
        return (
            <div className={MegaMenuStyles.Column}>
                <div className={MegaMenuStyles.HeaderText}>{MN.Item.Title}</div>
                {SubNodes?.map((N) => {
                    return RenderSubNode(N, Depth);
                })}
                {IsMyLinks &&
                    MyLinksSorted.map((L, idx) => {
                        return (
                            <Stack
                                horizontalAlign={"start"}
                                gap={10}
                                verticalAlign="space-between"
                                horizontal
                            >
                                {L.Link != "" ? (
                                    <div className={MegaMenuStyles.LinkText}>
                                        <a
                                            href={L.Link}
                                            onClick={() => {
                                                setOpen(false);
                                            }}
                                            onAuxClick={() => {
                                                setOpen(false);
                                            }}
                                        >
                                            {L.Title}
                                        </a>
                                    </div>
                                ) : (
                                    <div className={MegaMenuStyles.LinkText}>
                                        {L.Title}
                                    </div>
                                )}

                                {MyLinksEditMode && IsMyLinks && (
                                    <Stack
                                        horizontalAlign={"start"}
                                        gap={10}
                                        verticalAlign="end"
                                        horizontal
                                    >
                                        <IconButton
                                            iconProps={{ iconName: "Delete" }}
                                            className={MegaMenuStyles.Icon}
                                            onClick={async () => {
                                                if (await L.Delete()) {
                                                    await LoadData();
                                                }
                                            }}
                                            disabled={Loading}
                                        ></IconButton>
                                        <IconButton
                                            iconProps={{ iconName: "Edit" }}
                                            className={MegaMenuStyles.Icon}
                                            onClick={async () => {
                                                if (await L.Edit()) {
                                                    await LoadData();
                                                }
                                            }}
                                            disabled={Loading}
                                        ></IconButton>
                                        {idx != 0 && (
                                            <IconButton
                                                iconProps={{ iconName: "Up" }}
                                                className={MegaMenuStyles.Icon}
                                                onClick={async () => {
                                                    if (
                                                        await MyLinksL.current.HandleReorder(
                                                            L,
                                                            false,
                                                            MyLinksSorted
                                                        )
                                                    ) {
                                                        await LoadData();
                                                    }
                                                }}
                                                disabled={Loading}
                                            ></IconButton>
                                        )}
                                        {idx != MyLinks.length - 1 && (
                                            <IconButton
                                                iconProps={{ iconName: "Down" }}
                                                className={MegaMenuStyles.Icon}
                                                onClick={async () => {
                                                    if (
                                                        await MyLinksL.current.HandleReorder(
                                                            L,
                                                            true,
                                                            MyLinksSorted
                                                        )
                                                    ) {
                                                        await LoadData();
                                                    }
                                                }}
                                                disabled={Loading}
                                            ></IconButton>
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                        );
                    })}
                {MyLinksEditMode && IsMyLinks && (
                    <Stack grow horizontal horizontalAlign="center">
                        <IconButton
                            iconProps={{ iconName: "Add" }}
                            className={MegaMenuStyles.Icon}
                            onClick={async () => {
                                if (await MyLinksL.current.NewItem()) {
                                    await LoadData();
                                }
                            }}
                            disabled={Loading}
                        ></IconButton>
                    </Stack>
                )}
                {IsMyLinks && (
                    <Stack grow horizontal horizontalAlign="center">
                        <button
                            onClick={() => {
                                setMyLinksEditMode(!MyLinksEditMode);
                            }}
                        >
                            {MyLinksEditMode ? "Stop edition" : "Edit My Links"}
                        </button>
                    </Stack>
                )}
            </div>
        );
    };

    const Messages = MegaMenuParameters?.filter(
        (MNP) => MNP.Key == "TickerMessage"
    );
    const TickerLabel = MegaMenuParameters?.filter(
        (MNP) => MNP.Key == "TickerLabel"
    )
        .map((U) => U.Value)
        .join("");

    const TickerScrollVelocity = MegaMenuParameters?.filter(
        (MNP) => MNP.Key == "TickerScrollVelocity"
    );

    const TickerScrollVelocityNumber =
        TickerScrollVelocity != null && TickerScrollVelocity.length > 0
            ? TickerScrollVelocity[0].NumberValue
            : 0.12;

    return (
        <ErrorBoundary ComponentName="MegaMenu">
            <Stack
                horizontalAlign={"start"}
                verticalAlign={"center"}
                gap={5}
                grow
                styles={{ root: { width: "100%" } }}
            >
                {Errors?.length > 0 && (
                    <ShowErrors
                        Errors={Errors}
                        OnChange={(NewErrors) => {
                            setErrors(NewErrors);
                        }}
                    ></ShowErrors>
                )}

                {Ready && MegaMenuStructure && (
                    <>
                        <Stack
                            styles={{ root: { width: "100%" } }}
                            className={MegaMenuStyles.MegaMenuBar}
                        >
                            <Stack
                                horizontal
                                horizontalAlign="start"
                                verticalAlign="center"
                            >
                                <IconButton
                                    iconProps={{
                                        iconName: Open
                                            ? "ChromeClose"
                                            : "CollapseMenu",
                                    }}
                                    onClick={() => {
                                        setOpen(!Open);
                                    }}
                                    className={MegaMenuStyles.MainIcon}
                                    styles={{ icon: { fontSize: 30 } }}
                                ></IconButton>
                                <div style={{ height: 50 }}>
                                    <a
                                        href={
                                            props.Context.pageContext
                                                .legacyPageContext.portalUrl
                                        }
                                        onClick={() => {
                                            setOpen(false);
                                        }}
                                        onAuxClick={() => {
                                            setOpen(false);
                                        }}
                                    >
                                        <img
                                            style={{ height: "100%" }}
                                            src={Logo}
                                        />
                                    </a>
                                </div>
                            </Stack>

                            {Open && (
                                <div className={MegaMenuStyles.Elements}>
                                    {MegaMenuStructure.MegaMenuNodes.filter(
                                        FilterNodeGroups
                                    )
                                        .sort((a, b) => {
                                            return a.Position > b.Position
                                                ? 1
                                                : -1;
                                        })
                                        .map((MNN) => _RenderMegaMenuNode(MNN))}
                                </div>
                            )}
                        </Stack>
                        {Messages.length > 0 && (
                            <Stack
                                horizontal
                                horizontalAlign="start"
                                verticalAlign="center"
                                className={MegaMenuStyles.TickerBar}
                                grow
                                styles={{ root: { width: "100%" } }}
                            >
                                <div className={MegaMenuStyles.TickerBarHeader}>
                                    {TickerLabel}
                                </div>
                                <div style={{ width: "100%" }}>
                                    <Marquee
                                        velocity={TickerScrollVelocityNumber}
                                    >
                                        {Messages.sort((a, b) =>
                                            a.NumberValue > b.NumberValue
                                                ? 1
                                                : -1
                                        )
                                            .map((MNP) => MNP.Value)
                                            .join(" | ")}
                                    </Marquee>
                                </div>
                            </Stack>
                        )}
                    </>
                )}
            </Stack>
        </ErrorBoundary>
    );
}
