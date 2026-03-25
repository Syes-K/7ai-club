export abstract class BaseNode {
    private nextNodes: BaseNode[] = [];
    constructor(private readonly input: Record<string, unknown>) { }

    abstract start(): Promise<Record<string, unknown>>;

    abstract run(): Promise<any>;

    abstract end(): Promise<void>;
}