import { otpEmailWorker } from "./workers/mailWorkers";

async function handleJobFailure(job: any, err: any) {
    console.error(`❌ Job ${job.id} failed:`, err);
    try {
        await job.remove();
    } catch (removeErr) {
        console.error(`Failed to remove job ${job.id}:`, removeErr);
    }
}

otpEmailWorker.on("failed", handleJobFailure);

export default handleJobFailure;