const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { NotebookServiceClient } = require('@google-cloud/notebooks');

const buildStatusSuccess = 'SUCCESS';

functions.cloudEvent('notifyRadLab', async (cloudEvent) => {
  const cloudEventDataMessageData = cloudEvent.data.message.data;

  const buildData = JSON.parse(
    Buffer.from(cloudEventDataMessageData, 'base64').toString()
  );

  const triggerName = buildData['substitutions']['TRIGGER_NAME'];

  const alphaFoldTriggerName = 'rad-lab-launch-alpha-fold-pub-sub';
  const dataScienceTriggerName = 'rad-lab-launch-data-science-pub-sub';
  const genomicsCromwellTriggerName = 'rad-lab-launch-genomics-cromwell';
  const genomicsDSubTriggerName = 'rad-lab-launch-genomics-dsub';
  const siliconDesignTriggerName = 'rad-lab-launch-silicon-design';

  if (
    ![
      alphaFoldTriggerName,
      dataScienceTriggerName,
      genomicsCromwellTriggerName,
      genomicsDSubTriggerName,
      siliconDesignTriggerName,
    ].includes(triggerName)
  ) {
    console.log(`Not implemented for triggerName ${triggerName}`);
    return;
  }

  // See Build Resource https://cloud.google.com/build/docs/api/reference/rest/v1/projects.builds
  const buildStatus = buildData['status'];
  const requestId = buildData['substitutions']['_REQUEST_ID'];
  const tfStateBucketName = buildData['substitutions']['_STORAGE_BUCKET'];

  console.log('Received Build data', {
    triggerName,
    buildStatus,
    requestId,
    tfStateBucketName,
    cloudEventDataMessageData,
  });

  const firestore = new Firestore();
  const documentPath = `rad-lab-requests/${requestId}`;
  console.log('Fetching request data from %s...', documentPath);
  const requestData = await firestore.doc(documentPath).get();

  const storage = new Storage();
  const tfStateBucket = storage.bucket(tfStateBucketName);
  const tfStateFile = `${requestId}/default.tfstate`;
  console.log(
    'Fetching terraform state from bucket %s, file %s',
    tfStateBucketName,
    tfStateFile
  );
  const downloadTfStateFileResponse = await tfStateBucket
    .file(tfStateFile)
    .download();
  const tfState = JSON.parse(downloadTfStateFileResponse.toString());

  switch (triggerName) {
    case alphaFoldTriggerName:
      await handleAlphaFold(buildStatus, requestData, tfState);
      break;
    case dataScienceTriggerName:
      await handleDataScience(buildStatus, requestData, tfState);
      break;
    case genomicsCromwellTriggerName:
      await handleGenomicsCromwell(buildStatus, requestData, tfState);
      break;
    case genomicsDSubTriggerName:
      await handleGenomicsDSub(buildStatus, requestData, tfState);
      break;
    case siliconDesignTriggerName:
      await handleSiliconDesign(buildStatus, requestData, tfState);
      break;
    default:
      throw new Error(`Unexpected triggerName ${triggerName}`);
  }
});

/**
 * Handles alpha_fold deployments
 * @param {string} firestore
 * @param {any} requestData
 * @param {any} tfState
 */
async function handleAlphaFold(buildStatus, requestData, tfState) {
  console.log({ buildStatus, requestData, tfState });
}

/**
 * Handles data_science deployments
 * @param {string} firestore
 * @param {any} requestData
 * @param {any} tfState
 */
async function handleDataScience(buildStatus, requestData, tfState) {
  async function handleSuccess() {
    const projectId =
      tfState['outputs']['project-radlab-ds-analytics-id']['value'];
    const notebookInstanceNames =
      tfState['outputs']['notebooks-instance-names']['value'].split(',');
    const notebookInstanceLocations =
      tfState['outputs']['notebooks-instance-locations']['value'].split(',');

    const notebooksServiceClient = new NotebookServiceClient();
    for (const [
      notebookInstanceName,
      notebookInstanceLocation,
    ] of notebookInstanceNames.map((instanceName, i) => [
      instanceName,
      notebookInstanceLocations[i],
    ])) {
      const [notebookInstance] = await notebooksServiceClient.getInstance({
        name: `projects/${projectId}/locations/${notebookInstanceLocation}/instances/${notebookInstanceName}`,
      });
      console.log(
        JSON.stringify({ notebookInstance, notebookInstanceLocation })
      );
    }
  }

  if (buildStatus === buildStatusSuccess) {
    await handleSuccess();
  } else {
    console.log(`Not implemented for buildStatus ${buildStatus}`);
  }
}

/**
 * Handles genomics_cromwell deployments
 * @param {string} firestore
 * @param {any} requestData
 * @param {any} tfState
 */
async function handleGenomicsCromwell(buildStatus, requestData, tfState) {
  console.log({ buildStatus, requestData, tfState });
}

/**
 * Handles genomics_dsub deployments
 * @param {string} firestore
 * @param {any} requestData
 * @param {any} tfState
 */
async function handleGenomicsDSub(buildStatus, requestData, tfState) {
  console.log({ buildStatus, requestData, tfState });
}

/**
 * Handles silicon_design deployments
 * @param {string} firestore
 * @param {any} requestData
 * @param {any} tfState
 */
async function handleSiliconDesign(buildStatus, requestData, tfState) {
  console.log({ buildStatus, requestData, tfState });
}
