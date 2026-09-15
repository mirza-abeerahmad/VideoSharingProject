import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pageNumber = Math.max(Number(page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const filter = { isPublished: true }
    if (query) filter.$or = [{ title: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }]
    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")
        filter.owner = userId
    }
    const sort = { [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1 }
    const [videos, total] = await Promise.all([
        Video.find(filter).populate("owner", "fullName username avatar").sort(sort).skip((pageNumber - 1) * pageSize).limit(pageSize),
        Video.countDocuments(filter),
    ])
    return res.status(200).json(new ApiResponse(200, { videos, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title?.trim() || !description?.trim()) throw new ApiError(400, "Title and description are required")
    const videoPath = req.files?.videoFile?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path
    if (!videoPath || !thumbnailPath) throw new ApiError(400, "Video and thumbnail files are required")
    const [videoFile, thumbnail] = await Promise.all([uploadOnCloudinary(videoPath), uploadOnCloudinary(thumbnailPath)])
    if (!videoFile || !thumbnail) throw new ApiError(500, "Unable to upload media")
    const video = await Video.create({ title: title.trim(), description: description.trim(), videoFile: videoFile.url, thumbnail: thumbnail.url, duration: Number(videoFile.duration) || 0, owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, await video.populate("owner", "fullName username avatar"), "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")
    const visibility = req.user ? { $or: [{ isPublished: true }, { owner: req.user._id }] } : { isPublished: true }
    const video = await Video.findOne({ _id: videoId, ...visibility }).populate("owner", "fullName username avatar")
    if (!video) throw new ApiError(404, "Video not found")
    await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } })
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")
    const video = await Video.findOne({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or unauthorized")
    const { title, description } = req.body
    if (title !== undefined) video.title = title.trim()
    if (description !== undefined) video.description = description.trim()
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail) throw new ApiError(500, "Unable to upload thumbnail")
        video.thumbnail = thumbnail.url
    }
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")
    const video = await Video.findOneAndDelete({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or unauthorized")
    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")
    const video = await Video.findOne({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or unauthorized")
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
