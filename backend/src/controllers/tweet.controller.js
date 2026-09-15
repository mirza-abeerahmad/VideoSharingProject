import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if (!content?.trim()) throw new ApiError(400, "Tweet content is required")
    const tweet = await Tweet.create({ content: content.trim(), owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, await tweet.populate("owner", "fullName username avatar"), "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.userId)) throw new ApiError(400, "Invalid user id")
    const tweets = await Tweet.find({ owner: req.params.userId }).populate("owner", "fullName username avatar").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.tweetId) || !req.body.content?.trim()) throw new ApiError(400, "Valid tweet content is required")
    const tweet = await Tweet.findOneAndUpdate({ _id: req.params.tweetId, owner: req.user._id }, { content: req.body.content.trim() }, { new: true }).populate("owner", "fullName username avatar")
    if (!tweet) throw new ApiError(404, "Tweet not found or unauthorized")
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.tweetId)) throw new ApiError(400, "Invalid tweet id")
    const tweet = await Tweet.findOneAndDelete({ _id: req.params.tweetId, owner: req.user._id })
    if (!tweet) throw new ApiError(404, "Tweet not found or unauthorized")
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
