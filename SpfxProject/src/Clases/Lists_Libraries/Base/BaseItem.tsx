import { HttpRequestError } from "@pnp/odata";

import { BaseList } from "./BaseList";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { IWeb } from "@pnp/sp/webs";

export interface UserFieldData {
    Data: any;
    Title: string;
    Email: string;
    LoginName: string;
    ID: number;
}

export interface TaxonomyData {
    Label: string;
    TermGuid: string;
    RssId: string;
}

export interface UrlFieldData {
    Description: string;
    Url: string;
}

/**
 * Base item structure for all lists
 * Maps all common fields between lists and libraries
 */

export default class BaseItem {
    public ListItem: any;
    public ID: number;
    public GUID: any;
    public Created: Date;
    public Modified: Date;
    public List: BaseList;
    public Author: UserFieldData;
    public Editor: UserFieldData;
    public Title: string;
    public ServerRedirectedEmbedUrl: string;
    public ServerRedirectedEmbedUrlEdit: string;
    public IsFolder: boolean;
    public FileType: string;
    public FileName: any;
    public FileRef: string;
    public FileLeafRef: string;
    public ETag: string;

    constructor(Item: any, List: any) {
        this.List = List;
        this.ListItem = Item;
        this.MapBaseCamps();
    }
    /**
     * Maps common fields from items
     */
    private MapBaseCamps() {
        this.ID = this.ListItem["ID"];
        this.GUID = this.ListItem.GUID;
        this.Created = this.GetDateField(this.ListItem["Created"]);
        this.Modified = this.GetDateField(this.ListItem["Modified"]);
        this.Author = this.MapUserFieldValues(this.ListItem["Author"]);
        this.Editor = this.MapUserFieldValues(this.ListItem["Editor"]);
        this.Title =
            this.ListItem["Title"] != null ? this.ListItem["Title"] : "";
        this.ETag = this.ListItem["odata.etag"];
        if (this.List.IsLibrary) this.MapLibraryFields();
    }

    /**
     * Map common fields for libraries
     */

    private MapLibraryFields() {
        this.FileName =
            this.ListItem["FileLeafRef"] != null
                ? this.ListItem["FileLeafRef"].replace(/\.[^/.]+$/, "")
                : "";
        this.FileType = this.ListItem["File_x0020_Type"];
        this.IsFolder = this.GetBooleanFromNumberField(
            this.ListItem["FSObjType"]
        );
        this.FileRef =
            this.ListItem.FileRef != null ? this.ListItem.FileRef : "";
        this.FileLeafRef =
            this.ListItem.FileLeafRef != null ? this.ListItem.FileLeafRef : "";
        this.ServerRedirectedEmbedUrl = this.ListItem.ServerRedirectedEmbedUrl;
        if (["doc", "docx", "xlsx"].indexOf(this.FileType) != -1)
            this.ServerRedirectedEmbedUrlEdit =
                this.ServerRedirectedEmbedUrl.split("&action")[0] +
                "&action=edit";
        else this.ServerRedirectedEmbedUrlEdit = this.ServerRedirectedEmbedUrl;
    }

    /**
     * Map taxonomy list item value
     * @param Field
     * @returns
     */
    public GetTaxonomy(Field: any) {
        if (Field == null) return null;
        return Field as TaxonomyData;
    }

    /**
     * Map URL list item value
     * @param Field
     * @returns
     */

    public GetUrlField(Field: any) {
        return Field as UrlFieldData;
    }

    /**
     * Map text field item value
     * @param Field
     * @returns
     */

    public GetTextField(Field: any): string {
        return Field == null ? "" : Field;
    }

    /**
     * Maps Number field item value
     * @param Field
     * @param Default
     * @returns
     */

    public GetNumberField(Field: any, Default?: number): number {
        return Field == null
            ? Default != null
                ? Default
                : 0
            : parseFloat(Field);
    }

    /**
     * Maps Date Field item value
     * @param DateString
     * @returns
     */

    public GetDateField(DateString: string): Date {
        if (DateString != null && DateString != "") return new Date(DateString);
        else return null;
    }

    /**
     * Maps Boolean Field item value
     * @param Field
     * @param Default Indicate what default value do you want to return in case of a null value. If not indicated, it will return false
     * @returns
     */

    public GetBooleanField(Field: boolean, Default?: boolean): boolean {
        return Field == null ? (Default != null ? Default : false) : Field;
    }

    /**
     * Maps a number field as a boolean based on if value is 1 (true) other values (false)
     * @param Field
     * @returns
     */

    public GetBooleanFromNumberField(Field: string): boolean {
        if (Field != null && Field == "1") return true;
        return false;
    }

    /**
     * Maps a multi-user field value
     * @param ItemField
     * @returns
     */

    public MapMultiUserFieldValues(ItemField: any[]): UserFieldData[] {
        if (ItemField == null || ItemField.length == 0) return [];
        return ItemField.map((I) => this.MapUserFieldValues(I));
    }

    /**
     * Maps a user field value
     * @param ItemField
     * @returns
     */

    public MapUserFieldValues(ItemField: any): UserFieldData {
        return {
            Data: ItemField,
            Title: ItemField != null ? ItemField.Title : "",
            Email: ItemField != null ? ItemField.EMail : "",
            LoginName: ItemField != null ? ItemField.Name : "",
            ID: ItemField != null ? ItemField.ID : null,
        };
    }

    /**
     * Handles SharePoint pnpjs exceptions. If it is a valid pnpjs exception, it will try to decode the JSON result and extract the error message to throw it again. If not, it will throw the entire error back again
     * @param ex
     */

    public async HandleItemUpdateException(ex: Error) {
        let e: HttpRequestError = ex as HttpRequestError;
        if (e.isHttpRequestError) {
            let msg = "";
            if (e.status == 412) {
                e.message =
                    `Looks like the item was already edited by someone else` +
                    e.message;
                throw e;
            } else {
                const json = await e.response.clone().json();
                msg = json["odata.error"]["message"]["value"];
                e.message = `Error while updating the item: ${e.message}`;
                throw new Error(e.message);
            }
        } else {
            throw new Error(`Error while updating the item: ${""}`);
        }
    }

    /**
     * Will handle item removing for the current item. A popup to confirm the action will appear for the user. If item has been edited recently and ETag has changed, and exception will appear.
     *
     * @param Confirm optional parameter as default (true). If indicated as false, confirm action will not be request to the user and it will be deleted without input.
     * @param BatchedWeb optional parameter to make the request batched
     * @returns Removed document bin GUID or "false". If it hasnt been removed
     */

    public async Delete(Confirm = true, BatchedWeb?: IWeb) {
        if (Confirm) {
            let popupClosed = confirm(
                `Do you want to remove this ${
                    this.List.IsLibrary ? "document" : "item"
                }?`
            );

            if (!popupClosed) return false;
        }

        let List = this.List.LoadList(BatchedWeb);
        List.items
            .getById(this.ID)
            .update({}, this.ListItem["odata.etag"])
            .catch((E) => {
                this.HandleItemUpdateException(E);
            });

        return List.items.getById(this.ID).recycle();
    }

    /**
     * Function to get a refreshed version of the current item
     * @returns refreshed item.
     */

    public async Refresh() {
        let Item = await this.List.LoadByID(this.ID);

        return Item;
    }
}
