import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const [videoStats, totalSubscribers, totalVideos, totalLikes] = await Promise.all([
        Video.aggregate([{ $match: { owner: req.user._id } }, { $group: { _id: null, totalViews: { $sum: "$views" } } }]),
        Subscription.countDocuments({ channel: req.user._id }),
        Video.countDocuments({ owner: req.user._id }),
        Like.countDocuments({ video: { $in: await Video.find({ owner: req.user._id }).distinct("_id") } }),
    ])
    return res.status(200).json(new ApiResponse(200, { totalViews: videoStats[0]?.totalViews || 0, totalSubscribers, totalVideos, totalLikes }, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ owner: req.user._id }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }