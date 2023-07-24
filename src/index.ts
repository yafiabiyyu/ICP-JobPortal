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
} from "azle";
import { v4 as uuidv4 } from 'uuid'

type JobPost = Record<{
    id: string;
    name: string;
    description: string;
    requirements: string;
    salary: string;
    location: string;
    company: string;
    jobType: string;
    candidate: Opt<Vec<string>>;
    postOwner: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
    postStatus: boolean;
}>

type JobPostPayload = Record<{
    name: string;
    description: string;
    requirements: string;
    salary: string;
    location: string;
    company: string;
    jobType: string;
}>

const postList = new StableBTreeMap<string, JobPost>(0, 44, 512);

$query
export function getPostList(): Result<Vec<JobPost>, string>{
    return Result.Ok(postList.values().filter((post) => post.postStatus === true));
}

$query
export function getPostById(id: string): Result<JobPost, string>{
    return match(postList.get(id), {
        Some: (post) => {
            if(post.postStatus === false) {
                return Result.Err<JobPost, string>(`Post with id ${id} has been closed!`)
            }
            return Result.Ok<JobPost, string>(post)
        },
        None: () => Result.Err<JobPost, string>(`Post with id ${id} not found!`)
    })
}

$update
export function createPost(payload: JobPostPayload): Result<JobPost, string>{
    const newPost: JobPost = {
        id: uuidv4(),
        candidate: Opt.None,
        postOwner: ic.caller().toString(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        postStatus: true,
        ...payload
    }
    postList.insert(newPost.id, newPost);
    return Result.Ok(newPost);
}

$update
export function updatePost(id: string, payload: JobPostPayload): Result<JobPost, string>{
    return match(postList.get(id), {
        Some: (post) => {
            if(post.postOwner.toString() !== ic.caller().toString()) {
                return Result.Err<JobPost, string>("You are not the owner of this post!")
            }
            const updatePosts: JobPost = {
                ...post,
                ...payload,
                updatedAt: Opt.Some(ic.time())
            };
            postList.insert(id, updatePosts);
            return Result.Ok(updatePosts)
        },
        None: () => Result.Err<JobPost, string>(`Post with id ${id} not found!`)
    })
}

$update
export function closePost(id: string): Result<JobPost, string>{
    return match(postList.get(id), {
        Some: (post) => {
            if(post.postOwner.toString() !== ic.caller().toString()){
                return Result.Err<JobPost, string>("You are not the owner of this post!")
            }
            const closePost: JobPost = {
                ...post,
                postStatus: false,
            };
            postList.insert(post.id, closePost);
            return Result.Ok(closePost)
        },
        None: () => Result.Err<JobPost, string>(`Post with id ${id} not found!`)
    })
}

// UUID workaround
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}