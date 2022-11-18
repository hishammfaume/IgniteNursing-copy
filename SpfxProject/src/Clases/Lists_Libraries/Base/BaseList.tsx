import { IList } from "@pnp/sp/lists";
import { IWeb, IItem } from "@pnp/sp/presets/all";
import "@pnp/sp/presets/all";
import "@pnp/sp/lists";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { HttpRequestError } from "@pnp/odata";
import BaseItem from "./BaseItem";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
    FontWeights,
    Label,
    mergeStyleSets,
    Modal,
    PrimaryButton,
    Stack,
    StackItem,
} from "@fluentui/react";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";

/**
 * All fields that are request on all list queries that are based on this class
 */
const SelectAllFieldsBase: string[] = [
    "*",
    "Modified",
    "Author/Title",
    "Author/EMail",
    "Author/ID",
    "Editor/Title",
    "Editor/EMail",
    "Editor/ID",
];

/**
 * All fields that are expanded on requests of all list queries that are based on this class
 */
const ExpandAllFieldsBase: string[] = ["Author", "Editor"];

/**
 * All fields that are request of all list queries that are based on this class
 */
const SelectAllFieldsLibrary: string[] = [
    "*,FileLeafRef,FileRef,File_x0020_Type,ServerRedirectedEmbedUri",
];

/**
 * Base List class to be used to create expanded list classes
 */

export class BaseList {
    public ListName = "";
    public SelectAllFields: string[] = ["*"];
    public ExpandAllFields: string[] = [""];
    public IsLibrary = false;
    public GUID: string;
    public web: IWeb;
    public Context: WebPartContext | ApplicationCustomizerContext;
    public List: IList;
    /**
     * Creates an instance of BaseList.
     * @param web web of the list
     * @param context Webpart Context
     * @param ListName Listname
     * @param SelectAllFields Fields from custom list For Rest Api. Will be merged with the base select fields
     * @param ExpandAllFields Expand from custom list Fields for all Rest Api querys. WIll be merged with the base expand fields
     */
    constructor(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext,
        ListName: string,
        SelectAllFields: string[],
        ExpandAllFields: string[],
        IsLibrary = false
    ) {
        if (ListName == null || ListName == "")
            throw new Error(`List name cannot be empty`);
        this.web = web;
        this.Context = context;
        this.ListName = ListName;
        this.List = this.web.lists.getByTitle(this.ListName);
        this.IsLibrary = IsLibrary;
        this.SelectAllFields = this.MergeArrays([
            SelectAllFieldsBase,
            SelectAllFields,
            IsLibrary ? SelectAllFieldsLibrary : [],
        ]);
        this.ExpandAllFields = this.MergeArrays([
            ExpandAllFieldsBase,
            ExpandAllFields,
        ]);
    }

    /**
     * Returns a list item for queries
     * If Batchedweb is null. It will return the already initialized web object
     * @param BatchedWeb if it isnt null, it will initialize a new list object based on the batched web
     * @returns
     */
    public LoadList(BatchedWeb: IWeb) {
        return BatchedWeb == null
            ? this.List
            : BatchedWeb.lists.getByTitle(this.ListName);
    }

    /**
     * Merge two arrays removing duplicates
     * @param Arrays
     * @returns
     */

    private MergeArrays(Arrays: string[][]) {
        Arrays = Arrays.filter((A) => A != null);
        var Array: any[] = [].concat.apply([], Arrays);

        return Array.filter((item, index) => {
            return Array.indexOf(item) == index;
        });
    }

    /**
     * Load by id
     * @param ID Id of the element
     * @param [Batch] Optional, if we pass a Batch web. Request wont be resolved until batch get executed
     * @returns IItem of the query
     */
    public async LoadByID(ID: number, BatchedWeb?: IWeb): Promise<BaseItem> {
        if (ID == null || isNaN(ID)) throw `Is not a valid ID`;

        var List = this.LoadList(BatchedWeb);

        var Item: Promise<IItem> = List.items
            .filter(`ID eq ${ID}`)
            .expand(this.ExpandAllFields.join())
            .select(this.SelectAllFields.join())()
            .then((Data: IItem[]) => {
                if (Data.length == 0) return null;
                else return Data[0];
            })
            .catch(async (E) => {
                E = await this.HandleSPError(E);
                E.message = `Error while getting the element ${ID} from list ${this.ListName}`;
                throw E;
            });

        if (Item == null)
            throw new Error(
                `Cannot find the element ${ID} on the list ${this.ListName}`
            );

        return new BaseItem(await Item, this);
    }

    /**
     * Load all items
     * @param ID Id of the element
     * @param [Batch] Optional, if we pass a Batch web. Request wont be resolved until batch get executed
     * @returns IItem of the query
     */
    public async LoadAllItems(BatchedWeb?: IWeb): Promise<BaseItem[]> {
        var List = this.LoadList(BatchedWeb);

        var Items = List.items
            .expand(this.ExpandAllFields.join())
            .select(this.SelectAllFields.join())()
            .then((Data: IItem[]) => {
                return Data.map((I) => {
                    return new BaseItem(I, this);
                });
            })
            .catch(async (E) => {
                E = await this.HandleSPError(E);
                E.message = `Error while getting all items from list ${this.ListName}: ${E.message}`;
                throw E;
            });

        return await Items;
    }

    /**
     * Opens a modal warning the user that the session token has expired. After pressing an "OK" button the page will be reloaded
     */
    private OpenReloadModal() {
        const theme: any = (window as any).__themeState__.theme;
        const contentStyles = mergeStyleSets({
            container: {
                display: "flex",
                flexFlow: "column nowrap",
                alignItems: "stretch",
            },
            header: [
                // eslint-disable-next-line deprecation/deprecation
                theme.xLargePlus,
                {
                    flex: "1 1 auto",
                    borderTop: `4px solid ${theme.themePrimary}`,
                    color: theme.neutralPrimary,
                    display: "flex",
                    alignItems: "center",
                    fontWeight: FontWeights.semibold,
                    padding: "12px 12px 14px 24px",
                },
            ],
            body: {
                flex: "4 4 auto",
                padding: "0 24px 24px 24px",
                overflowY: "hidden",
                selectors: {
                    p: { margin: "14px 0" },
                    "p:first-child": { marginTop: 0 },
                    "p:last-child": { marginBottom: 0 },
                },
            },
        });

        const iconButtonStyles = {
            root: {
                color: theme.neutralPrimary,
                marginLeft: "auto",
                marginTop: "4px",
                marginRight: "2px",
            },
            rootHovered: {
                color: theme.neutralDark,
            },
        };

        var Popup = (
            <Modal
                isOpen={true}
                isModeless={false}
                isBlocking={true}
                containerClassName={contentStyles.container}
            >
                <div style={{ minWidth: 600 }} className={contentStyles.header}>
                    <Stack grow={1} horizontal horizontalAlign="space-between">
                        <StackItem align="start">
                            <span>{`Session timed out`}</span>
                        </StackItem>
                    </Stack>
                </div>
                <div className={contentStyles.body}>
                    <Stack horizontalAlign={"center"}>
                        <Label>
                            {
                                "Session expired because of inactivity, please reload the page."
                            }
                        </Label>
                    </Stack>
                    <Stack
                        style={{ paddingTop: 30 }}
                        tokens={{ childrenGap: 10 }}
                        grow={1}
                        horizontal
                        horizontalAlign="center"
                    >
                        <PrimaryButton
                            text={"Reload"}
                            onClick={() => {
                                location.reload();
                            }}
                        ></PrimaryButton>
                    </Stack>
                </div>
            </Modal>
        );

        let container = document.createElement("div");
        document.body.appendChild(container);
        ReactDOM.render(Popup, container);
    }

    /**
     * Handles SharePoint pnpjs exceptions.
     *
     * If it is a valid pnpjs exception, it will try to decode the JSON result and return the error processed to be handled.
     *
     * If not, it will return the initial error
     *
     * If a token timeout error happens. The Open Reload modal will be launched
     * @param ex
     */
    public async HandleSPError(ex: Error) {
        var e: HttpRequestError = ex as HttpRequestError;
        if (e.isHttpRequestError) {
            const json = await e.response.clone().json();

            if (json["odata.error"] != null) {
                if (
                    json["odata.error"]["code"] ==
                    "-2130575252, Microsoft.SharePoint.SPException"
                ) {
                    this.OpenReloadModal();
                }
                ex.message = json["odata.error"]["message"]["value"];
            } else {
                ex.message = json["error"]["message"];
            }

            return ex;
        }
        return ex;
    }
}
