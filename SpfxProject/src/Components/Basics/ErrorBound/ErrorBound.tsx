import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IWeb } from "@pnp/sp/webs";
import * as React from "react";

interface ErrorBoundaryProps {
    ComponentName: string;
}

interface ErrorBoundaryState {
    HasError: boolean;
    ErrorMessage: string;
}

export default class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { HasError: false, ErrorMessage: "" };
    }

    static getDerivedStateFromError(error) {
        // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto
        return { HasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // También puedes registrar el error en un servicio de reporte de errores

        console.log(errorInfo);
        let Error: string = `'${error}' '${errorInfo}'`;
        this.setState({ ErrorMessage: Error });
    }

    render() {
        if (this.state.HasError) {
            // Puedes renderizar cualquier interfaz de repuesto
            return (
                <h1>{`Something happened while trying to render this component '${this.props.ComponentName}': ${this.state.ErrorMessage}`}</h1>
            );
        }

        return this.props.children;
    }
}
