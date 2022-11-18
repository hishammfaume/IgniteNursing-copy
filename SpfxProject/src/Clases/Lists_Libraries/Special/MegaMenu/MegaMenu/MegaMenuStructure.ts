import { UserFieldData } from "../../../Base/BaseItem";
import { MegaMenuItem } from "../MegaMenuItem";

export interface MegaMenuNode {
    Title: string;
    Position: number;
    SubNodes: MegaMenuNode[];
    Group: UserFieldData[];
    Item: MegaMenuItem;
}

/**
 * Sorts and creates the structure needed for the megamenu to function
 *
 */
export class MegaMenuStructure {
    public MegaMenuItems: MegaMenuItem[];
    public MegaMenuNodes: MegaMenuNode[];
    public MyLinkNodes: MegaMenuNode[];

    public constructor(MegaMenuItems: MegaMenuItem[]) {
        this.MegaMenuItems = MegaMenuItems;
        this.PrepareMegaMenuStructure();
    }

    /**
     * Prepares the data for each MegaMenu. Then filters and groups each node on hits parent node
     */
    private PrepareMegaMenuStructure() {
        try {
            let NodeByKey: { [key: string]: MegaMenuNode } = {};

            this.MegaMenuItems.forEach((Item) => {
                NodeByKey[Item.ID] = {
                    Title: Item.Title,
                    Position: Item.Order,
                    SubNodes: [],
                    Group: Item.Group,
                    Item: Item,
                };
            });

            Object.keys(NodeByKey).map((k) => {
                let Node = NodeByKey[k];
                if (Node.Item.ParentNode.ID != null) {
                    if (NodeByKey[Node.Item.ParentNode.ID] != null) {
                        NodeByKey[Node.Item.ParentNode.ID].SubNodes.push(Node);
                    }
                }
            });
            this.MegaMenuNodes = [];
            this.MyLinkNodes = [];
            Object.keys(NodeByKey)
                .map((k) => {
                    let Node: MegaMenuNode = NodeByKey[k];
                    if (Node.Item.ParentNode.ID != null) {
                        return;
                    }

                    this.MegaMenuNodes.push(Node);
                })
                .filter((N) => N != null);
        } catch (Ex) {
            Ex.message = `Error while trying to prepare the MegaMenu structure: ${Ex.message}`;
            throw Ex;
        }
    }
}
