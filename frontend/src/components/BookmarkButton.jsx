import { BsBookmark } from "react-icons/bs";

export default function BookmarkButton() {
    return (
        <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-2 rounded-full">
            <BsBookmark className="w-4 h-4"/>
        </button>
    )
}