declare module "d3-force-3d" {
  export interface ForceCollide<NodeDatum> {
    (alpha: number): void;
    initialize(nodes: NodeDatum[]): void;
    radius(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    strength(): number;
    strength(strength: number): this;
    iterations(): number;
    iterations(iterations: number): this;
  }

  export function forceCollide<NodeDatum = object>(
    radius?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
  ): ForceCollide<NodeDatum>;

  export interface ForceAxis<NodeDatum> {
    (alpha: number): void;
    initialize(nodes: NodeDatum[]): void;
    strength(): number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number);
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
  }

  export function forceX<NodeDatum = object>(
    x?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
  ): ForceAxis<NodeDatum>;
  export function forceY<NodeDatum = object>(
    y?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
  ): ForceAxis<NodeDatum>;
  export function forceZ<NodeDatum = object>(
    z?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
  ): ForceAxis<NodeDatum>;
}
