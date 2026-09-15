import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    return toggleLike(req, res, { video: videoId }, "video")
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    return toggleLike(req, res, { comment: commentId }, "comment")
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    return toggleLike(req, res, { tweet: tweetId }, "tweet")
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } }).populate({ path: "video", populate: { path: "owner", select: "fullName username avatar" } }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, likes.map((like) => like.video).filter(Boolean), "Liked videos fetched successfully"))
})

const toggleLike = async (req, res, target, label) => {
    if (!isValidObjectId(Object.values(target)[0])) throw new ApiError(400, `Invalid ${label} id`)
    const existingLike = await Like.findOne({ ...target, likedBy: req.user._id })
    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new ApiResponse(200, { liked: false }, `${label} unliked successfully`))
    }
    await Like.create({ ...target, likedBy: req.user._id })
    return res.status(201).json(new ApiResponse(201, { liked: true }, `${label} liked successfully`))
}

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}