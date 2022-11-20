import { IItem } from "@pnp/sp/items";

import MyLinksList from "./MyLinksList";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { SPFI } from "@pnp/sp";
import BaseItem, { UserFieldData } from "../Base/BaseItem";
import LinkForm from "./Components/LinkForm";
import { IWeb } from "@pnp/sp/webs";

/**
 * Class to map and handle Saved Search Queries Item
 */
export class MyLinksItem extends BaseItem {
    public List: MyLinksList;

    public User: UserFieldData;
    public Title: string;
    public Link: string;
    public LinkOrder: number;
    public ListItem: any;

    constructor(Item: any, List: MyLinksList) {
        super(Item, List);
        this.ListItem = Item;
        this.List = List;
        this.MapFields();
    }

    public async Edit() {
        let container;
        let popupClosed = new Promise(
            (resolve: (bool: boolean) => void, reject) => {
                let Popup = (
                    <LinkForm
                        List={this.List}
                        Item={this}
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

    public async Update(Link: string, Title: string) {
        await this.List.List.items.getById(this.ID).update({
            Title: Title,
            Link: `${Link.trim()}`,
        });
    }
    public async UpdateLinkOrder(Number: number, BatchedWeb?: IWeb) {
        let List = this.List.LoadList(BatchedWeb);
        return await List.items.getById(this.ID).update({
            LinkOrder: Number,
        });
    }

    private MapFields() {
        this.Title = super.GetTextField(this.ListItem["Title"]);
        this.Link = super.GetTextField(this.ListItem["Link"]);
        this.User = super.MapUserFieldValues(this.ListItem["User"]);
        this.LinkOrder = super.GetNumberField(this.ListItem["LinkOrder"], -1);
    }
}
