import { Log } from "@microsoft/sp-core-library";

import { Dialog } from "@microsoft/sp-dialog";

import {
    BaseApplicationCustomizer,
    PlaceholderContent,
    PlaceholderName,
} from "@microsoft/sp-application-base";
import * as strings from "MegaMenuApplicationCustomizerStrings";
import * as React from "react";
import MegaMenu, {
    MegaMenuProps,
} from "../../Clases/Lists_Libraries/Special/MegaMenu/MegaMenu/MegaMenu";
import * as ReactDOM from "react-dom";
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import { HubSite } from "../../Clases/Tools/Groups/utils";

const LOG_SOURCE: string = "MegaMenuApplicationCustomizer";

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IMegaMenuApplicationCustomizerProperties {
    // This is an example; replace with your own property
    testMessage: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class MegaMenuApplicationCustomizer extends BaseApplicationCustomizer<IMegaMenuApplicationCustomizerProperties> {
    private SP: SPFI;

    private _topPlaceholder: PlaceholderContent | undefined;
    public onInit(): Promise<void> {
        super
            .onInit()
            .then((_) => {
                this.SP = spfi().using(SPFx(this.context));
            })
            .then((_) => {
                console.log("Sp Initilize");
                this.context.placeholderProvider.changedEvent.add(
                    this,
                    this._renderPlaceHolders
                );
            })
            .catch((E) => {
                throw E;
            });
        return Promise.resolve();
    }

    private _renderPlaceHolders(): void {
        // Handling the top placeholder
        if (!this._topPlaceholder) {
            this._topPlaceholder =
                this.context.placeholderProvider.tryCreateContent(
                    PlaceholderName.Top,
                    { onDispose: this._onDispose }
                );

            // The extension should not assume that the expected placeholder is available.
            if (!this._topPlaceholder) {
                console.error("The expected placeholder (Top) was not found.");
                return;
            }
            if (this.properties) {
                let MainWeb = Web([
                    this.SP.web,
                    this.context.pageContext.legacyPageContext.portalUrl +
                        HubSite,
                ]);
                // Add refrence of react component to this file.
                const element: React.ReactElement<MegaMenuProps> =
                    React.createElement(MegaMenu, {
                        Web: MainWeb,
                        Context: this.context,
                    });
                ReactDOM.render(element, this._topPlaceholder.domElement);
            }
        }
    }
    private _onDispose(): void {
        console.log(
            "[HelloWorldApplicationCustomizer._onDispose] Disposed custom top and bottom placeholders."
        );
    }
}
