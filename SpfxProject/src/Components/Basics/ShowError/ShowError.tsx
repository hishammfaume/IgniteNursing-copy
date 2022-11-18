import { MessageBarType, MessageBar } from "@fluentui/react";
import * as React from "react";

interface ShowErrorsProps {
    /**
     * List of Errors to render
     */
    Errors: string[];
    /**
     * Returns new list of errors when users clicks the X button
     */
    OnChange: (Errors: string[]) => void;
}

/**
 * Shows a list of errors on a Warning Message Bar
 *
 * When the user clicks the X on one error. The OnChange function returns the new list of errors
 *
 * Error are grouped by text. If two or more errors have the same text, they will be grouped in the same line and a number display will appear (X)
 * @param Props
 * @returns
 */
const ShowErrors = (Props: ShowErrorsProps) => {
    const GroupedByError: { [key: string]: number[] } = Props.Errors.reduce(
        function (rv: any, x, idx) {
            (rv[x] = rv[x] || []).push(idx);
            return rv;
        },
        {}
    );

    return (
        <div>
            {Object.keys(GroupedByError).map((Error: string, index) => {
                var Indexes = GroupedByError[Error];
                return (
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        onDismiss={() => {
                            var NewErrors = [...Props.Errors];

                            Indexes.forEach((p) =>
                                NewErrors.splice(
                                    NewErrors.indexOf(p.toString()),
                                    1
                                )
                            );

                            Props.OnChange(NewErrors);
                        }}
                        dismissButtonAriaLabel={`Close`}
                    >
                        {`${Error}: (${Indexes.length})`}
                    </MessageBar>
                );
            })}
        </div>
    );
};

export default ShowErrors;
