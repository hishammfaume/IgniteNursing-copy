import { IWeb, IItem } from "@pnp/sp/presets/all";
import "@pnp/sp/presets/all";
import "@pnp/sp/lists";
import { MegaMenuItem } from "./MegaMenuItem";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { BaseList } from "../../Base/BaseList";
import { MegaMenuStructure } from "./MegaMenu/MegaMenuStructure";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";

const ListName = "MegaMenu";
const SelectAllFields: string[] = [
    "*",
    "ParentNode/ID",
    "ParentNode/Title",
    "Group/ID",
    "Group/Title",
];
const ExpandAllFields: string[] = ["ParentNode", "Group"];

/**
 * Handles queries against MegaMenuList
 */
export default class MegaMenuList extends BaseList {
    public constructor(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext
    ) {
        super(web, context, "MegaMenu", SelectAllFields, ExpandAllFields);
    }

    /**
     * Obtains all MegaMenuItems
     * @param BatchedWeb
     * @returns
     */
    public async LoadMegaMenuItems(BatchedWeb?: IWeb) {
        var List = super.LoadList(BatchedWeb);

        var Items = new Promise(
            (resolve: (IItem: MegaMenuItem[]) => void, reject) => {
                List.items
                    .top(5000)
                    .expand(...this.ExpandAllFields)
                    .select(...this.SelectAllFields)()
                    .then((Data: IItem[]) => {
                        if (Data.length == 0) {
                            resolve(null);
                            return;
                        }

                        Data.map((I) => new MegaMenuItem(I, this));
                        resolve(Data.map((I) => new MegaMenuItem(I, this)));
                    })
                    .catch(async (ex) => {
                        ex = await super.HandleSPError(ex);
                        reject(ex);
                    });
            }
        );

        console.log(Items);

        return await Items;
    }

    /**
     * Loads the megamenu item structure
     */
    public async LoadMegaMenu(BatchedWeb?: IWeb) {
        var MegaMenuItems = await this.LoadMegaMenuItems(BatchedWeb);

        var MegaMenu: MegaMenuStructure = new MegaMenuStructure(MegaMenuItems);
        return MegaMenu;
    }
}
