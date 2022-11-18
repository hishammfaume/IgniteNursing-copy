import { IItem } from "@pnp/sp/items";
import ComasisItem, { UserFieldData } from "../../Base/BaseItem";
import BaseItem from "../../Base/BaseItem";
import MegaMenuList from "./MegaMenuList";

interface ParentNodeLookup {
    LookupValue: any;
    ID: number;
    Title: string;
}

export class MegaMenuCustomFunctionOptions {
    //All declared "MegaMenu" string that are valid for the list item
    static "mylinks": string = "MyLinks";
    static "none": string = "None";
    static "not implemented": string = "Not Implemented";

    /** Parses the given string to try to match it to the existing functions ignoring UpperCases */
    public static ParseOption(Value: string) {
        if (Value == null || Value == "")
            return MegaMenuCustomFunctionOptions.none;
        switch (Value.toLowerCase()) {
            case MegaMenuCustomFunctionOptions["mylinks"].toLowerCase():
                return MegaMenuCustomFunctionOptions["mylinks"];

            default:
                return MegaMenuCustomFunctionOptions["not implemented"];
        }
    }
}

/**
 * Class for mapping and handling Mega Menu Items
 */

export class MegaMenuItem extends BaseItem {
    public List: MegaMenuList;

    public NodeDeepness: number;
    public ParentNode: ParentNodeLookup;
    public Title: string;
    public Order: number;
    public Link: string;
    public Group: UserFieldData[];
    public CustomFunctionValue: string;
    public CustomFunction: string;

    constructor(Item: any, List: MegaMenuList) {
        super(Item, List);
        this.ListItem = Item;
        this.List = List;
        this.MapFields();
    }

    private MapFields() {
        this.Title = super.GetTextField(this.ListItem["Title"]);
        this.Order = super.GetNumberField(this.ListItem["MenuHierarchyOrder"]);

        this.CustomFunctionValue =
            this.ListItem["CustomFunction"] != null
                ? this.ListItem["CustomFunction"]
                : "";

        this.CustomFunction = MegaMenuCustomFunctionOptions.ParseOption(
            this.CustomFunctionValue
        );

        this.Link = super.GetTextField(this.ListItem["Link"]);

        this.Group = super.MapMultiUserFieldValues(this.ListItem["Group"]);

        let ParentNodeLookup = this.ListItem["ParentNode"];
        this.ParentNode = {
            LookupValue: ParentNodeLookup,
            ID: ParentNodeLookup != null ? ParentNodeLookup["ID"] : null,
            Title: ParentNodeLookup != null ? ParentNodeLookup["Title"] : "",
        };
    }
}
