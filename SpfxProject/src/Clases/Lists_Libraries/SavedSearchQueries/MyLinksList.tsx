import { IWeb, IItem } from "@pnp/sp/presets/all";
import "@pnp/sp/presets/all";
import "@pnp/sp/lists";
import { MyLinksItem } from "./MyLinksItem";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { BaseList } from "../Base/BaseList";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import * as ReactDOM from "react-dom";
import * as React from "react";
import LinkForm from "./Components/LinkForm";

const SelectAllFields: string[] = ["*", "User/Title", "User/ID", "User/EMail"];
const ExpandAllFields: string[] = ["User"];

interface FormProps {
    UserId: number;
    Link: string;
    Title: string;
}

/**
 * Class to handle queries against "Saved Search Queries List"
 */
export default class MyLinksList extends BaseList {
    public constructor(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext
    ) {
        super(web, context, "MyLinks", SelectAllFields, ExpandAllFields);
    }

    /**
     * Creates a new Saved Search Queries Item
     * @param FormParams
     * @returns
     */
    public async AddItem({ UserId, Link, Title }: FormProps) {
        try {
            let Item = await this.List.items.add({
                Title: Title,
                Link: Link,
                UserId: UserId,
            });
            let BaseItem = await this.LoadByID(Item.data["ID"]);
            let ProjectQueueItem = new MyLinksItem(BaseItem.ListItem, this);

            return ProjectQueueItem;
        } catch (ex) {
            ex = await this.HandleSPError(ex);
            ex.message = `Error while trying add a new Link: ${ex.message}`;
            throw ex;
        }
    }

    public arraymove(arr: any[], fromIndex: number, Up: boolean) {
        let element = arr[fromIndex];
        let toIndex = Up ? fromIndex + 1 : fromIndex - 1;
        if (toIndex < 0 || toIndex >= arr.length) return arr; //Already at the top or bottom.
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
        return arr;
    }

    public async HandleReorder(
        Item: MyLinksItem,
        down: boolean,
        ItemsInOrder: MyLinksItem[]
    ) {
        let CurrentPosition = 0;
        ItemsInOrder.forEach((I, idx) => {
            if (I.ID == Item.ID) CurrentPosition = idx;
        });

        let ItemsInNewOrder: MyLinksItem[] = this.arraymove(
            ItemsInOrder,
            CurrentPosition,
            down
        );

        let [BatchedWeb, Execute] = this.web.batched();

        let NeedToUpdate: { Item: MyLinksItem; NewOrder: number }[] = [];

        ItemsInNewOrder.forEach((I, idx) => {
            if (I.LinkOrder != idx) {
                NeedToUpdate.push({
                    Item: I,
                    NewOrder: idx,
                });
            }
        });

        let Results = Promise.all(
            NeedToUpdate.map((NU) => {
                return NU.Item.UpdateLinkOrder(NU.NewOrder, BatchedWeb);
            })
        );

        await Execute();
        await Results;

        return (await Results).length > 0;
    }

    public async NewItem() {
        let container;
        let popupClosed = new Promise(
            (resolve: (bool: boolean) => void, reject) => {
                let Popup = (
                    <LinkForm
                        List={this}
                        close={() => {
                            resolve(false);
                        }}
                        submit={() => {
                            resolve(true);
                        }}
                    ></LinkForm>
                );

                container = document.createElement("div");
                document.body.appendChild(container);
                ReactDOM.render(Popup, container);
            }
        );

        let result = await popupClosed;
        ReactDOM.unmountComponentAtNode(container);

        return result;
    }

    /**
     * Obtains the saved search queries for the current user
     * @param BatchedWeb
     * @returns Saved Search Query Item
     */
    public async GetMyQueries(BatchedWeb?: IWeb) {
        let List = super.LoadList(BatchedWeb);
        console.log(this.Context.pageContext.legacyPageContext);
        let Items = new Promise(
            (resolve: (IItem: MyLinksItem[]) => void, reject) => {
                List.items
                    .top(5000)
                    .expand(...this.ExpandAllFields)
                    .select(...this.SelectAllFields)
                    /*.filter(
                        `User/Name eq '${this.Context.pageContext.legacyPageContext.systemUserKey}'`
                    )*/
                    ()
                    .then((Data: IItem[]) => {
                        let Queries = Data.map((I) => {
                            return new MyLinksItem(I, this);
                        });
                        resolve(Queries);
                    })
                    .catch(async (ex) => {
                        ex = await super.HandleSPError(ex);
                        ex.message = `Error trying the user saved links: ${ex.message}`;
                        reject(ex);
                    });
            }
        );

        return await Items;
    }
}
