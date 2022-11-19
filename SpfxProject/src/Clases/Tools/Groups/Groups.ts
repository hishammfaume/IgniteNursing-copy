import { ISiteGroups } from "@pnp/sp/site-groups";
import { ISiteGroupInfo, _SiteGroups } from "@pnp/sp/site-groups/types";
import { IWeb } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/batching";
import { GraphFI, graphfi, SPFx } from "@pnp/graph";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/graph/users";
import "@pnp/graph/groups";
import "@pnp/graph/members";

/**
 * Singleton pattern
 *
 * Class to manage Sp groups
 *
 * Queries all SP groups once. Then maps the requiered groups to letiables that we want to be used on the webpart
 */
export default class GroupsSP {
    public Graph: GraphFI;
    public AllSiteGroups: ISiteGroupInfo[];
    public AllSiteGroupsByString: { [key: string]: any };

    public CurrentUserGroups: ISiteGroupInfo[];
    public CurrentGraphgroups: any[];
    public GroupsByString: { [key: string]: any };
    public GroupsByID: { [key: number]: any };
    public IsLoaded: Promise<boolean>;
    public LoadingError: Error;
    public Web: IWeb;
    static myInstance: GroupsSP = null;

    public CurrentLoggedUserId: number;

    constructor(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext
    ) {
        this.Graph = graphfi().using(SPFx(context));
        this.Web = web;
        this.GetGroups().catch((ex) => {
            throw ex;
        });
    }

    /**
     * Get Groups Query
     */
    private async GetGroups() {
        this.IsLoaded = new Promise(async (resolve, reject) => {
            const [Batched, execute] = this.Web.batched();
            let G = this.Graph.me
                .memberOf()
                .then((G2) => (this.CurrentGraphgroups = G2));

            let BatchedWeb = this.Web.using(Batched);

            let AllGroupsResult = BatchedWeb.siteGroups().then((G) => {
                this.AllSiteGroups = G;
            });
            let CurrentUserGroupsResult = BatchedWeb.currentUser
                .groups()
                .then((G) => {
                    this.CurrentUserGroups = G;
                });

            let CurrentLoggedUserResult = BatchedWeb.currentUser().then(
                (U) => (this.CurrentLoggedUserId = U.Id)
            );

            await execute();

            await Promise.all([
                AllGroupsResult,
                CurrentUserGroupsResult,
                G,
            ]).catch((E) => {
                this.LoadingError = E;
                resolve(false);
            });

            this.MapGroups();

            resolve(true);
        });
    }

    /**
     * Map all groups by key
     *
     * Removes upercases
     *
     * Map al requiered groups to letiables
     */

    private MapGroups() {
        try {
            this.AllSiteGroupsByString = {};
            this.AllSiteGroups.map((G) => {
                this.AllSiteGroupsByString[(G.Title as string).toLowerCase()] =
                    G;
            });

            this.GroupsByString = {};
            this.CurrentUserGroups.map((G) => {
                this.GroupsByString[(G.Title as string).toLowerCase()] = G;
            });

            this.CurrentGraphgroups?.map((G) => {
                this.GroupsByString[
                    (G["displayName"] as string).toLowerCase()
                ] = G;
            });

            this.GroupsByID = {};
            this.CurrentUserGroups.map((G) => {
                this.GroupsByID[G.Id] = G;
            });
        } catch (Ex) {
            Ex.message = `Error while trying to map the user groups ${Ex.message}`;
            throw Ex;
        }
    }

    static getInstance(
        web: IWeb,
        context: WebPartContext | ApplicationCustomizerContext
    ) {
        if (GroupsSP.myInstance == null) {
            GroupsSP.myInstance = new GroupsSP(web, context);
        }
        return GroupsSP.myInstance;
    }

    private MapSiteGroup(Title: string): ISiteGroupInfo {
        let Group =
            this.AllSiteGroupsByString[Title.toLowerCase()] != null
                ? this.AllSiteGroupsByString[Title.toLowerCase()]
                : null;

        if (Group == null) {
            throw new Error(`Could not find the site group ${Title}`);
        }

        return Group;
    }

    public CheckGroupById(ID: number): boolean {
        return this.GroupsByID[ID] != null ? true : false;
    }
    public CheckGroup(Title: string): boolean {
        return this.GroupsByString[Title.toLowerCase()] != null ? true : false;
    }
}
function graphSPFx(context: any): import("@pnp/core").TimelinePipe<any> {
    throw new Error("Function not implemented.");
}
