import { DEFERRED_GRADE_REF, evidenceNfcTrim } from "./identifiers.js";
import { EvidenceValidator } from "./validator.js";
import { EvidenceSourceValidator } from "./source-validator.js";
import { EvidenceProvenanceValidator } from "./provenance-validator.js";
import { EvidenceItemValidator } from "./item-validator.js";
import { EvidenceCollectionValidator } from "./collection-validator.js";
import type {
  Evidence,
  EvidenceItem,
  EvidenceProvenance,
  EvidenceSource,
} from "./types.js";

export interface CreateEvidenceInput {
  readonly evidence_id: string;
  readonly summary: string;
  readonly source: EvidenceSource;
  readonly provenance: EvidenceProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly items?: readonly EvidenceItem[];
  readonly grade_ref?: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly evidence_version?: string;
  readonly collection?: Evidence["collection"];
  readonly bears_on?: readonly string[];
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly protocol_ref?: string;
  readonly dataset_refs?: readonly string[];
  readonly citation_refs?: readonly string[];
}

export class EvidenceFactory {
  private readonly validator = new EvidenceValidator();
  private readonly source = new EvidenceSourceValidator();
  private readonly provenance = new EvidenceProvenanceValidator();
  private readonly items = new EvidenceItemValidator();
  private readonly collection = new EvidenceCollectionValidator();

  createDraft(input: CreateEvidenceInput): Evidence {
    const source = this.source.validate(input.source);
    const provenance = this.provenance.validate(input.provenance);
    const items = this.items.validateAll(input.items ?? [], "draft");
    const collection = this.collection.validate(input.collection, items);

    const evidence: Evidence = Object.freeze({
      evidence_id: input.evidence_id,
      ontology_ref: input.ontology_ref ?? "SCI-000@0.1.0",
      spec_ref: input.spec_ref ?? "SCI-002@0.1.0",
      evidence_version: input.evidence_version ?? "1.0.0",
      summary: evidenceNfcTrim(input.summary),
      record_state: "draft",
      source,
      provenance,
      grade_ref: evidenceNfcTrim(input.grade_ref ?? DEFERRED_GRADE_REF),
      ethics_constraint_marker: "non_clinical",
      created_by: evidenceNfcTrim(input.created_by),
      created_at: input.created_at,
      items,
      ...(collection ? { collection } : {}),
      ...(input.bears_on ? { bears_on: Object.freeze([...input.bears_on]) } : {}),
      ...(input.ai_assisted !== undefined ? { ai_assisted: input.ai_assisted } : {}),
      ...(input.human_sponsor ? { human_sponsor: evidenceNfcTrim(input.human_sponsor) } : {}),
      ...(input.protocol_ref ? { protocol_ref: input.protocol_ref } : {}),
      ...(input.dataset_refs ? { dataset_refs: Object.freeze([...input.dataset_refs]) } : {}),
      ...(input.citation_refs
        ? { citation_refs: Object.freeze([...input.citation_refs]) }
        : {}),
      record_transition_log: Object.freeze([]),
    });

    this.validator.validate(evidence);
    return evidence;
  }
}
