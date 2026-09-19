/** Package marker — Sprint 8: full Scientific Core KO surface (SCI-001…006). */
export interface CorePackageMarker {
  readonly packageId: "@sciros/core";
  readonly sprint: 8;
  readonly scientificBehaviour: true;
  readonly claimImplemented: true;
  readonly evidenceImplemented: true;
  readonly gradeImplemented: true;
  readonly contradictionImplemented: true;
  readonly negativeResultImplemented: true;
  readonly verificationImplemented: true;
}

export const corePackageMarker: CorePackageMarker = {
  packageId: "@sciros/core",
  sprint: 8,
  scientificBehaviour: true,
  claimImplemented: true,
  evidenceImplemented: true,
  gradeImplemented: true,
  contradictionImplemented: true,
  negativeResultImplemented: true,
  verificationImplemented: true,
};
