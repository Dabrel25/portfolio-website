import { buildGraph } from "./graph";
import { buildProfessionalNodes, buildProfessionalEdges } from "./graph-builders";

export const graph = buildGraph(buildProfessionalNodes(), buildProfessionalEdges());
