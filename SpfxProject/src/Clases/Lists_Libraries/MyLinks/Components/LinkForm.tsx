import {
    DefaultButton,
    FontWeights,
    IconButton,
    mergeStyleSets,
    Modal,
    PrimaryButton,
    Spinner,
    SpinnerSize,
    Stack,
    StackItem,
    TextField,
} from "@fluentui/react";

import { SPFI } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";

import { Search } from "@pnp/sp/search";

import MyLinksList from "../MyLinksList";
import { MyLinksItem } from "../MyLinksItem";
import ShowErrors from "../../../../Components/Basics/ShowError/ShowError";
import { useState } from "react";
import * as React from "react";

interface MyLinkProps {
    List: MyLinksList;
    Item?: MyLinksItem;
    close?: () => void;
    submit: () => void;
}
const theme: any = (window as any).__themeState__.theme;
const contentStyles = mergeStyleSets({
    container: {
        display: "flex",
        flexFlow: "column nowrap",
        alignItems: "stretch",
    },
    header: [
        theme.xLargePlus,
        {
            flex: "1 1 auto",
            borderTop: `4px solid ${theme.themePrimary}`,
            color: theme.neutralPrimary,
            display: "flex",
            alignItems: "center",
            fontWeight: FontWeights.semibold,
            padding: "12px 12px 14px 24px",
        },
    ],
    body: {
        flex: "4 4 auto",
        padding: "0 24px 24px 24px",
        overflowY: "hidden",
        selectors: {
            p: { margin: "14px 0" },
            "p:first-child": { marginTop: 0 },
            "p:last-child": { marginBottom: 0 },
        },
    },
});
const toggleStyles = { root: { marginBottom: "20px" } };
const iconButtonStyles = {
    root: {
        color: theme.neutralPrimary,
        marginLeft: "auto",
        marginTop: "4px",
        marginRight: "2px",
    },
    rootHovered: {
        color: theme.neutralDark,
    },
};

const ComponentName = "LinkForm";

/**
 * Component to create a new Saved Search query
 *
 *
 * @param props
 * @returns Calls submit() or close() functions on exit or success
 */
export default function LinkForm(props: MyLinkProps) {
    const [Saving, setSaving] = useState(false);

    const [Link, setLink] = useState(props.Item ? props.Item.Link : "");
    const [Title, setTitle] = useState(props.Item ? props.Item.Title : "");
    const [Errors, setErrors] = useState([]);
    const [Success, setSuccess] = useState(false);

    /**
     * Checks if required fields are correctly populated
     * @returns true if fields are correct
     */
    const SubmitAvailable = () => {
        if (Title.trim() == "") {
            return false;
        }
        if (Link.trim() == "") {
            return false;
        }
        return true;
    };

    /**
     * Creates a new Saved Search Query Item
     */
    async function SaveMyLink() {
        try {
            setSaving(true);
            if (Link.trim() == "") {
                throw new Error("Search query name cannot be empty");
            }
            if (props.Item != null) {
                await props.Item.Update(Link.trim(), Title.trim()).catch(
                    (Ex) => {
                        throw Ex;
                    }
                );
            } else {
                await props.List.AddItem({
                    UserId: props.List.Context.pageContext.legacyPageContext
                        .userId,
                    Title: Title.trim(),
                    Link: Link.trim(),
                });
            }

            setSuccess(true);
            props.submit();
        } catch (Ex) {
            setErrors([...Errors, Ex.message]);
        }
        setSaving(false);
    }

    return (
        <Modal
            isOpen={true}
            onDismiss={() => {
                props.close();
            }}
            isModeless={false}
            isBlocking={true}
            containerClassName={contentStyles.container}
        >
            <div style={{ minWidth: 400 }} className={contentStyles.header}>
                <Stack grow={1} horizontal horizontalAlign="space-between">
                    <StackItem align="start">
                        <span>{`My Link`}</span>
                    </StackItem>
                    <StackItem align="end">
                        <IconButton
                            iconProps={{ iconName: "Cancel" }}
                            onClick={() => {
                                props.close();
                            }}
                        />
                    </StackItem>
                </Stack>
            </div>
            <div className={contentStyles.body}>
                <ShowErrors
                    Errors={Errors}
                    OnChange={(NewErrors) => {
                        setErrors(NewErrors);
                    }}
                ></ShowErrors>
                {Saving && <Spinner size={SpinnerSize.large}></Spinner>}
                {!Saving && !Success && (
                    <Stack padding={10} tokens={{ childrenGap: 10 }}>
                        <Stack>
                            <TextField
                                required
                                label={"Title"}
                                value={Title}
                                onChange={(e, v) => {
                                    setTitle(v);
                                }}
                            ></TextField>
                        </Stack>
                        <Stack>
                            <TextField
                                required
                                label={"Link"}
                                value={Link}
                                onChange={(e, v) => {
                                    setLink(v);
                                }}
                            ></TextField>
                        </Stack>
                        <Stack
                            tokens={{ childrenGap: 10 }}
                            grow={1}
                            horizontal
                            horizontalAlign="center"
                        >
                            <PrimaryButton
                                text={`Save`}
                                disabled={
                                    !SubmitAvailable() || Saving || Link == ""
                                }
                                onClick={async () => {
                                    SaveMyLink().catch((Ex) => {
                                        throw Ex;
                                    });
                                }}
                                allowDisabledFocus
                            />
                            <DefaultButton
                                text={`Cancel`}
                                onClick={() => {
                                    props.close();
                                }}
                                allowDisabledFocus
                            />
                        </Stack>
                    </Stack>
                )}
            </div>
        </Modal>
    );
}
