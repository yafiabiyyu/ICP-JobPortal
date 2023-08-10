import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Opt,
    Principal,
    float64,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// User data
type Users = Record<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    registeredAt: nat64;
}>;

type EducationHistory = Record<{
    id: string;
    userId: string;
    educationLevel: string;
    institutionName: string;
    fieldOfStudy: string;
    yearOfEntry: nat64;
    yearOfGraduation: nat64;
    gpa: float64;
    description: string;
    createdAt: nat64;
}>;

type WorkHistory = Record<{
    id: string;
    userId: string;
    companyName: string;
    position: string;
    yearStarted: nat64;
    yearEnded: nat64;
    salary: string;
    description: string;
    createdAt: nat64;
}>;

// Company data
type Company = Record<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    admin: string;
    createdAt: nat64;
}>;

type Job = Record<{
    id: string;
    companyId: string;
    position: string;
    requirements: string;
    location: string;
    salary: string;
    description: string;
    postOwner: string;
    postStatus: boolean;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

type JobApplication = Record<{
    id: string;
    jobId: string;
    userId: string;
    coverLetter: string;
    resume: string;
    portofolio: Opt<string>;
    applicationDate: nat64;
}>;

// Payload
type UsersPayload = Record<{
    fullName: string;
    email: string;
    phone: string;
}>;

type EducationHistoryPayload = Record<{
    educationLevel: string;
    institutionName: string;
    fieldOfStudy: string;
    yearOfEntry: nat64;
    yearOfGraduation: nat64;
    gpa: float64;
    description: string;
}>;

type WorkHistoryPayload = Record<{
    companyName: string;
    position: string;
    yearStarted: nat64;
    yearEnded: nat64;
    salary: string;
    description: string;
}>;

type CompanyPayload = Record<{
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
}>;

type JobPayload = Record<{
    position: string;
    requirements: string;
    location: string;
    salary: string;
    description: string;
}>;

type JobApplicationPayload = Record<{
    jobId: string;
    coverLetter: string;
    resume: string;
    portofolio: Opt<string>;
}>;

const users = new StableBTreeMap<Principal, Users>(0, 44, 512);
const education = new StableBTreeMap<string, EducationHistory>(1, 44, 512);
const work = new StableBTreeMap<string, WorkHistory>(2, 44, 512);
const companies = new StableBTreeMap<string, Company>(3, 44, 512);
const jobs = new StableBTreeMap<string, Job>(4, 44, 512);
const application = new StableBTreeMap<string, JobApplication>(5, 44, 512);

// User functions
$update;
export function userRegister(payload: UsersPayload): Result<Users, string> {
    const user: Users = {
        id: ic.caller().toString(),
        registeredAt: ic.time(),
        ...payload,
    };

    users.insert(ic.caller(), user);
    return Result.Ok<Users, string>(user);
}

$query;
export function getWorkHistory(): Result<Vec<WorkHistory>, string> {
    const works = work
        .values()
        .filter((workHistory) => workHistory.userId === ic.caller().toString());
    return Result.Ok(works);
}

$update;
export function addWorkHistory(
    payload: WorkHistoryPayload
): Result<WorkHistory, string> {
    const user = users
        .values()
        .filter((usr) => usr.id === ic.caller().toString());
    if (user.length === 0) {
        return Result.Err("User not found");
    }
    const newWorkHistory: WorkHistory = {
        id: uuidv4(),
        userId: ic.caller().toString(),
        createdAt: ic.time(),
        ...payload,
    };
    work.insert(newWorkHistory.id, newWorkHistory);
    return Result.Ok<WorkHistory, string>(newWorkHistory);
}

$update;
export function updateWorkHistory(
    id: string,
    payload: WorkHistoryPayload
): Result<WorkHistory, string> {
    return match(work.get(id), {
        Some: (workHistory) => {
            if (workHistory.userId !== ic.caller().toString()) {
                return Result.Err<WorkHistory, string>("Not authorized");
            }
            const updateWork: WorkHistory = {
                ...workHistory,
                ...payload,
            };
            work.insert(workHistory.id, updateWork);
            return Result.Ok<WorkHistory, string>(updateWork);
        },
        None: () => Result.Err<WorkHistory, string>("Work history not found"),
    });
}

$update;
export function removeWorkHistory(id: string): Result<WorkHistory, string> {
    return match(work.get(id), {
        Some: (workHistory) => {
            if (workHistory.userId !== ic.caller().toString()) {
                return Result.Err<WorkHistory, string>("Not authorized");
            }
            work.remove(id);
            return Result.Ok<WorkHistory, string>(workHistory);
        },
        None: () => Result.Err<WorkHistory, string>("Work history not found"),
    });
}

$query;
export function getEducationHistory(): Result<Vec<EducationHistory>, string> {
    const edu = education
        .values()
        .filter((eduHistory) => eduHistory.userId === ic.caller().toString());
    if (edu.length === 0) {
        return Result.Err("Education history not found");
    }
    return Result.Ok(edu);
}

$update;
export function addEducationHistory(
    payload: EducationHistoryPayload
): Result<EducationHistory, string> {
    const usr = users
        .values()
        .filter((user) => user.id === ic.caller().toString());
    if (usr.length === 0) {
        return Result.Err("User not found");
    }
    const newEducationHistory: EducationHistory = {
        id: uuidv4(),
        userId: ic.caller().toString(),
        createdAt: ic.time(),
        ...payload,
    };
    education.insert(newEducationHistory.id, newEducationHistory);
    return Result.Ok<EducationHistory, string>(newEducationHistory);
}

$update;
export function updateEducationHistory(
    id: string,
    payload: EducationHistoryPayload
): Result<EducationHistory, string> {
    return match(education.get(id), {
        Some: (eduHistory) => {
            if (eduHistory.userId !== ic.caller().toString()) {
                return Result.Err<EducationHistory, string>("Not authorized");
            }
            const updateEdu: EducationHistory = {
                ...eduHistory,
                ...payload,
            };
            education.insert(eduHistory.id, updateEdu);
            return Result.Ok<EducationHistory, string>(updateEdu);
        },
        None: () =>
            Result.Err<EducationHistory, string>("Education history not found"),
    });
}

$update;
export function removeEducationHistory(
    id: string
): Result<EducationHistory, string> {
    return match(education.get(id), {
        Some: (eduHistory) => {
            if (eduHistory.userId !== ic.caller().toString()) {
                return Result.Err<EducationHistory, string>("Not authorized");
            }
            education.remove(id);
            return Result.Ok<EducationHistory, string>(eduHistory);
        },
        None: () =>
            Result.Err<EducationHistory, string>("Education history not found"),
    });
}

$update;
export function companyRegister(
    payload: CompanyPayload
): Result<Company, string> {
    const newCompany: Company = {
        id: uuidv4(),
        createdAt: ic.time(),
        admin: ic.caller().toString(),
        ...payload,
    };
    companies.insert(newCompany.id, newCompany);
    return Result.Ok<Company, string>(newCompany);
}

$update;
export function updateCompany(
    id: string,
    payload: CompanyPayload
): Result<Company, string> {
    return match(companies.get(id), {
        Some: (company) => {
            if (company.admin !== ic.caller().toString()) {
                return Result.Err<Company, string>("Not authorized");
            }
            const updateCompany: Company = {
                ...company,
                ...payload,
            };
            companies.insert(company.id, updateCompany);
            return Result.Ok<Company, string>(updateCompany);
        },
        None: () => Result.Err<Company, string>("Company not found"),
    });
}

$update;
export function removeCompany(id: string): Result<Company, string> {
    return match(companies.get(id), {
        Some: (company) => {
            const job = jobs
                .values()
                .filter((job) => job.companyId === company.id);
            if (company.admin !== ic.caller().toString()) {
                return Result.Err<Company, string>("Not authorized");
            } else {
                if (job.length > 0) {
                    return Result.Err<Company, string>(
                        "Company still have job"
                    );
                }
                companies.remove(id);
                return Result.Ok<Company, string>(company);
            }
        },
        None: () => Result.Err<Company, string>("Company not found"),
    });
}

$query;
export function getJobPostList(): Result<Vec<Job>, string> {
    return Result.Ok(jobs.values().filter((job) => job.postStatus === true));
}

$query;
export function getJobPostListByCompany(
    companyId: string
): Result<Vec<Job>, string> {
    return Result.Ok(
        jobs
            .values()
            .filter(
                (job) => job.companyId === companyId && job.postStatus === true
            )
    );
}

$update;
export function addJobPost(payload: JobPayload): Result<Job, string> {
    const company = companies
        .values()
        .filter((comp) => comp.admin === ic.caller().toString());
    if (company.length === 0) {
        return Result.Err("Company not found");
    }
    const newJob: Job = {
        id: uuidv4(),
        companyId: company[0].id,
        createdAt: ic.time(),
        updatedAt: Opt.None,
        postStatus: true,
        postOwner: ic.caller().toString(),
        ...payload,
    };
    jobs.insert(newJob.id, newJob);
    return Result.Ok<Job, string>(newJob);
}

$update;
export function updateJobPost(
    id: string,
    payload: JobPayload
): Result<Job, string> {
    return match(jobs.get(id), {
        Some: (job) => {
            if (job.postOwner !== ic.caller().toString()) {
                return Result.Err<Job, string>("Not authorized");
            }
            const updateJob: Job = {
                ...job,
                ...payload,
                updatedAt: Opt.Some(ic.time()),
            };
            jobs.insert(job.id, updateJob);
            return Result.Ok<Job, string>(updateJob);
        },
        None: () => Result.Err<Job, string>("Job not found"),
    });
}

$update;
export function removeJobPost(id: string): Result<Job, string> {
    return match(jobs.get(id), {
        Some: (job) => {
            if (job.postOwner !== ic.caller().toString()) {
                return Result.Err<Job, string>("Not authorized");
            }
            jobs.remove(id);
            return Result.Ok<Job, string>(job);
        },
        None: () => Result.Err<Job, string>("Job not found"),
    });
}

$update;
export function closeJobPost(id: string): Result<Job, string> {
    return match(jobs.get(id), {
        Some: (job) => {
            if (job.postOwner !== ic.caller().toString()) {
                return Result.Err<Job, string>("Not authorized");
            }
            const updateJob: Job = {
                ...job,
                postStatus: false,
            };
            jobs.insert(job.id, updateJob);
            return Result.Ok<Job, string>(updateJob);
        },
        None: () => Result.Err<Job, string>("Job not found"),
    });
}

$update;
export function applyJobPost(
    payload: JobApplicationPayload
): Result<JobApplication, string> {
    const job = jobs.values().filter((jo) => jo.id === payload.jobId);
    const user = users.get(ic.caller());
    if (job.length === 0) {
        return Result.Err("Job not found");
    }
    if (job[0].postStatus === false) {
        return Result.Err("Job is closed");
    }
    if (user === null) {
        return Result.Err("You are not registered");
    }
    const newApplication: JobApplication = {
        id: uuidv4(),
        userId: ic.caller().toString(),
        applicationDate: ic.time(),
        ...payload,
    };
    application.insert(newApplication.id, newApplication);
    return Result.Ok<JobApplication, string>(newApplication);
}

globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
