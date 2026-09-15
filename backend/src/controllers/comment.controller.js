import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")
    const pageNumber = Math.max(Number(page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50)
    const [comments, total] = await Promise.all([
        Comment.find({ video: videoId }).populate("owner", "fullName username avatar").sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
        Comment.countDocuments({ video: videoId }),
    ])
    return res.status(200).json(new ApiResponse(200, { comments, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) }, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    if (!mongoose.isValidObjectId(videoId) || !content?.trim()) throw new ApiError(400, "Valid video id and comment content are required")
    if (!await Video.exists({ _id: videoId })) throw new ApiError(404, "Video not found")
    const comment = await Comment.create({ content: content.trim(), video: videoId, owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, await comment.populate("owner", "fullName username avatar"), "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    if (!mongoose.isValidObjectId(req.params.commentId) || !content?.trim()) throw new ApiError(400, "Valid comment content is required")
    const comment = await Comment.findOneAndUpdate({ _id: req.params.commentId, owner: req.user._id }, { content: content.trim() }, { new: true }).populate("owner", "fullName username avatar")
    if (!comment) throw new ApiError(404, "Comment not found or unauthorized")
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.commentId)) throw new ApiError(400, "Invalid comment id")
    const comment = await Comment.findOneAndDelete({ _id: req.params.commentId, owner: req.user._id })
    if (!comment) throw new ApiError(404, "Comment not found or unauthorized")
    return res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
