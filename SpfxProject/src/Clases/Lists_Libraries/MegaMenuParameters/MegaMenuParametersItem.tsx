import { IItem } from "@pnp/sp/items";

import MegaMenuParametersList from "./MegaMenuParametersList";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { SPFI } from "@pnp/sp";
import BaseItem, { UserFieldData } from "../Base/BaseItem";

import { IWeb } from "@pnp/sp/webs";

/**
 * Class to map and handle Saved Search Queries Item
 */
export class MegaMenuParametersItem extends BaseItem {
    public List: MegaMenuParametersList;

    public Key: string;
    public Value: string;
    public NumberValue: number;

    constructor(Item: any, List: MegaMenuParametersList) {
        super(Item, List);
        this.ListItem = Item;
        this.List = List;
        this.MapFields();
    }

    private MapFields() {
        this.Key = super.GetTextField(this.ListItem["Key"]);
        this.Value = super.GetTextField(this.ListItem["Value"]);
        this.NumberValue = super.GetNumberField(
            this.ListItem["NumberValue"],
            0.12
        );
    }
}
