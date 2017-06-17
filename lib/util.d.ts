export declare function waitForNode(client: any, selector: any, waitTimeout: number): Promise<{}>;
export declare function wait(timeout: number): Promise<{}>;
export declare function nodeExists(client: any, selector: any): Promise<boolean>;
export declare function getPosition(client: any, selector: any): Promise<{
    x: number;
    y: number;
}>;
export declare function click(client: any, useArtificialClick: any, selector: any): Promise<void>;
export declare function focus(client: any, selector: any): Promise<void>;
export declare function evaluate(client: any, fn: any): Promise<any>;
export declare function type(client: any, useArtificialClick: any, text: any, selector: any): Promise<void>;
export declare function sendKeyCode(client: any, useArtificialClick: any, keyCode: any, selector: any, modifiers: any): Promise<void>;
export declare function backspace(client: any, useArtificialClick: any, n: any, selector: any): Promise<void>;
export declare function getValue(client: any, selector: any): Promise<any>;
export declare function getCookies(client: any, url: string): Promise<any>;
export declare function setCookies(client: any, cookies: any[], url: any): Promise<any[]>;
export declare function clearCookies(client: any): Promise<void>;
export declare function screenshot(client: any): Promise<any>;
