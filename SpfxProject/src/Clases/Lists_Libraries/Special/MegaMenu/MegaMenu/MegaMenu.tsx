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
import MyLinksList from "../../../SavedSearchQueries/MyLinksList";
import { MyLinksItem } from "../../../SavedSearchQueries/MyLinksItem";
import { Item } from "@pnp/sp/items";

export interface MegaMenuProps {
    SP: SPFI;
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
    const SPGroups = useRef<GroupsSP>(null);
    const [Ready, setReady] = useState(false);
    const [MyLinksEditMode, setMyLinksEditMode] = useState(false);

    const [MyLinks, setMyLinks] = useState<MyLinksItem[]>([]);

    const [Open, setOpen] = useState(false);

    const [Loading, setLoading] = useState(false);

    useEffect(() => {
        initialLoad().catch((Ex) => {
            setErrors([...Errors, Ex.message]);
        });
    }, []);

    const LoadData = async () => {
        try {
            setLoading(true);
            let MyLinks = await MyLinksL.current.GetMyQueries();
            let MegaMenuStructure = await MegaMenuListRef.current
                .LoadMegaMenu()
                .catch((Ex) => {
                    throw Ex;
                });
            setMegaMenuStructure(MegaMenuStructure);
            setMyLinks(MyLinks);
            setReady(true);
            setLoading(false);
        } catch (Ex) {
            setErrors([...Errors, Ex.message]);
        }
        setLoading(false);
    };

    async function initialLoad() {
        try {
            SPGroups.current = GroupsSP.getInstance(
                props.SP.web,
                props.Context
            );

            MegaMenuListRef.current = new MegaMenuList(
                props.SP.web,
                props.Context
            );
            MyLinksL.current = new MyLinksList(props.SP.web, props.Context);

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
                SPGroups.current.CheckGroupById(G.ID)
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

    /**
     * Renders MegaMenuNode and all its children
     * @param MN
     * @returns
     */
    const _RenderMegaMenuNode = (MN: MegaMenuNode): JSX.Element => {
        let SubNodes =
            MN.SubNodes && MN.SubNodes.length > 0
                ? MN.SubNodes.filter(FilterNodeGroups)
                      .sort(SortNodeGroups)
                      .map((N) => N)
                : [];

        let MyLinksSorted = MyLinks.sort((a, b) => {
            let SortValueA: number = a.LinkOrder != -1 ? a.LinkOrder : a.ID;
            let sortValueB: number = b.LinkOrder != -1 ? b.LinkOrder : a.ID;
            return SortValueA > sortValueB ? 1 : -1;
        });
        let IsMyLinks = MN.Item.CustomFunction == "MyLinks";
        return (
            <div className={MegaMenuStyles.Column}>
                <div className={MegaMenuStyles.HeaderText}>{MN.Item.Title}</div>
                {SubNodes?.sort((a, b) => {
                    return a.Position > b.Position ? 1 : -1;
                }).map((N) => {
                    return N.Item.Link != "" ? (
                        <div className={MegaMenuStyles.LinkText}>
                            <a href={N.Item.Link}>{N.Title}</a>
                        </div>
                    ) : (
                        <div className={MegaMenuStyles.LinkText}>{N.Title}</div>
                    );
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
                                        <a href={L.Link}>{L.Title}</a>
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

    return (
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
                                iconName: Open ? "ChromeClose" : "CollapseMenu",
                            }}
                            onClick={() => {
                                setOpen(!Open);
                            }}
                            className={MegaMenuStyles.MainIcon}
                            styles={{ icon: { fontSize: 30 } }}
                        ></IconButton>
                        <span className={MegaMenuStyles.LogoText}>
                            {"Cloud Academy"}
                        </span>
                    </Stack>

                    {Open && (
                        <div className={MegaMenuStyles.Elements}>
                            {MegaMenuStructure.MegaMenuNodes.sort((a, b) => {
                                return a.Position > b.Position ? 1 : -1;
                            }).map((MNN) => _RenderMegaMenuNode(MNN))}
                        </div>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
