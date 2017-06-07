export interface Options {
    useArtificialClick?: boolean;
    closeTab?: boolean;
    waitTimeout?: number;
    runRemote?: boolean;
}
declare class Chromeless {
    private options;
    private cdp;
    private queue;
    private client;
    private processCallback;
    private lastValue;
    private target;
    static functionUrl: string;
    constructor(options?: Options);
    goto(url: string): Chromeless;
    click(selector: string, artificialClick?: boolean): Chromeless;
    type(text: string, selector?: string): Chromeless;
    backspace(n: number, selector?: string): Chromeless;
    getCookies(url: string): Chromeless;
    setCookies(cookies: any[], url: string): Chromeless;
    clearCookies(): Chromeless;
    sendKeyCode(keyCode: number, selector?: string, modifiers?: number): Chromeless;
    wait(selector: string | number): Chromeless;
    evaluate(fn: string | (() => void)): Chromeless;
    value(selector: string): Chromeless;
    screenshot(outputPath: string): Chromeless;
    processJobs(jobs: any[]): Promise<any>;
    end(): Promise<any>;
    private processRemote();
    private processLocal();
    saveJobs(path: any): Promise<void>;
    private serializeJobs();
    private getSerializableJobs();
    private deserializeJobs(jobs);
    private prepareFunction(job);
    private extractFunctionBody(fn);
}
export default Chromeless;
