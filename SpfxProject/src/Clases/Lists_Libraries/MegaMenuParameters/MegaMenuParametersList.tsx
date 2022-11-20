import { IWeb, IItem } from "@pnp/sp/presets/all";
import "@pnp/sp/presets/all";
import "@pnp/sp/lists";
import { MegaMenuParametersItem } from "./MegaMenuParametersItem";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { BaseList } from "../Base/BaseList";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import * as ReactDOM from "react-dom";
import * as React from "react";

import GroupsSP from "../../Tools/Groups/Groups";

const SelectAllFields: string[] = ["*"];
const ExpandAllFields: string[] = [];

const ListName = "MegaMenuParameters";

/**
 * Class to handle queries against MegaMenuParameters
 */
export default class MegaMenuParametersList extends BaseList {
    public constructor(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext
    ) {
        super(web, context, ListName, SelectAllFields, ExpandAllFields);
    }

    /**
     * Obtains all MegaMenuParameters
     * @param BatchedWeb
     * @returns Saved Search Query Item
     */
    public async GetAll(BatchedWeb?: IWeb) {
        let List = super.LoadList(BatchedWeb);
        console.log(this.Context.pageContext.legacyPageContext);
        let Items = new Promise(
            (resolve: (IItem: MegaMenuParametersItem[]) => void, reject) => {
                List.items
                    .top(5000)
                    .expand(...this.ExpandAllFields)
                    .select(...this.SelectAllFields)()
                    .then((Data: IItem[]) => {
                        let Queries = Data.map((I) => {
                            return new MegaMenuParametersItem(I, this);
                        });
                        resolve(Queries);
                    })
                    .catch(async (ex) => {
                        ex = await super.HandleSPError(ex);
                        ex.message = `Error trying to get the MegaMenuParameters: ${ex.message}`;
                        reject(ex);
                    });
            }
        );

        return await Items;
    }
}
