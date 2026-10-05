import { BsChatSquare } from "react-icons/bs";

export default function CommentButton({chirp}) {
    return (
        <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-1 rounded-full">
            <BsChatSquare className="w-4 h-4"/>
            <p>{chirp.reply_count}</p>
        </button>
    )
}