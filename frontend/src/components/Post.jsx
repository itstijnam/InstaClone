import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from './ui/button'
import { FaBeer, FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from './CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import axios from 'axios'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Badge } from './ui/badge'

function Post({ post }) {
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    const { user } = useSelector((store) => { return store.auth });
    const { posts } = useSelector((store) => { return store.post });
    const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
    const [postLike, setPostLike] = useState(post.likes.length)
    const [comment, setComment] = useState(post.comments);
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        if (inputText.trim()) {
            setText(inputText)
        } else {
            setText('');
        }
    }

    const deletePostHandler = async () => {
        try {
            const res = await axios.delete(`http://localhost:3000/api/v1/user/delete/${post?._id}`, { withCredentials: true })
            if (res.data.success) {
                const updatedData = posts.filter((postItem) => postItem?._id !== post?._id)
                dispatch(setPosts(updatedData))
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message)
        }
    }

    const likeOrDislikeHandler = async (req, res) => {
        try {
            const action = liked ? 'dislike' : 'like'
            const res = await axios.get(`http://localhost:3000/api/v1/user/${post._id}/${action}`, { withCredentials: true });
            if (res.data.success) {
                const updatedLikes = liked ? postLike - 1 : postLike + 1;
                setPostLike(updatedLikes);
                setLiked(!liked);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? {
                        ...p,
                        likes: liked ? p.likes.filter(id !== user._id) : [user._id, ...p.likes]
                    } : p
                );
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }

        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message)
        }
    }
    const commentHandler = async () => {
        try {
            const res = await axios.post(`http://localhost:3000/api/v1/user/${post._id}/comment`, { text }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            if (res.data.success) {
                const updatedCommentData = [...comment, res.data.comment];
                setComment(updatedCommentData);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, comments: updatedCommentData } : p
                );
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
                setText('')
            }
        } catch (error) {
            toast.error(error.response.data.message)
        }
    }
    return (
        <div className='my-8 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 '>
                    <Avatar className='PostAvatarContainer bg-gray-50 text-white p-1 rounded-full w-9 h-9 flex justify-center text-center'>
                        <AvatarImage src={post.author.profilePicture} className='PostAuthorPP' alt='profile_image' onClick={likeOrDislikeHandler} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className='flex gap-2'> 
                        <h1>{post.author.username}</h1>
                        {user?._id === post?.author?._id && <Badge>Author</Badge> }  
                    </div>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className="flex flex-col items-center text-sm text-center">
                        <Button variant="ghost" className="cursor-pointer w-fit text-[#ED4956] font-bold" >Unfollow</Button>
                        <Button variant="ghost" className="cursor-pointer w-fit font-bold" >Add to favourites</Button>
                        {
                            user && user?._id === post?.author._id && <Button onClick={deletePostHandler} variant="ghost" className="cursor-pointer w-fit font-bold" >Delete</Button>
                        }

                    </DialogContent>
                </Dialog>
            </div>
            <img
                className='rounded-sm my-2 w-full aspect-square object-cover'
                src={post?.image}
                alt="post_img"
            />
            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3 '>
                    {
                        liked ? <FaHeart onClick={likeOrDislikeHandler} size={'22px'} className='cursor-pointer text-[#ED4956]' /> : <FaRegHeart onClick={likeOrDislikeHandler} size={'22px'} className='cursor-pointer hover:text-gray-600' />
                    }
                    <MessageCircle
                        onClick={() => {
                            dispatch(setSelectedPost(post));
                            setOpen(true)
                        }}
                        className='cursor-pointer hover:text-gray-600'
                    />
                    <Send className='cursor-pointer hover:text-gray-600' />
                </div>
                <Bookmark className='cursor-pointer hover:text-gray-600' />
            </div>
            <span className='font-medium block'>{postLike} likes</span>
            <p className='cursor-pointer'>
                <span className='font-medium mr-2'>{post.author.username}</span>
                {post?.caption}
            </p>
            {
                comment.length > 0 && (
                    <span
                        onClick={() => {
                            dispatch(setSelectedPost(post));
                            setOpen(true)
                        }}
                        className='text-gray-400 text-sm cursor-pointer'
                    >View all {comment.length} comments</span>
                )
            }

            <CommentDialog open={open} setOpen={setOpen} post={post} />
            <div className='flex items-center justify-between'>
                <input
                    type="text"
                    placeholder='Add a comment...'
                    value={text}
                    onChange={changeEventHandler}
                    className='outline-none text-sm w-full'
                />
                {
                    text && <span onClick={commentHandler} className='text-[#3BADF8] cursor-pointer'>Post</span>
                }
            </div>
        </div>
    )
}

export default Post