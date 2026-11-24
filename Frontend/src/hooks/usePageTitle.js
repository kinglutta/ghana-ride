import { useEffect } from 'react'

/** Sets a consistent browser tab title for every YENKO page. */
const usePageTitle = (title) => {
    useEffect(() => {
        document.title = `${title} · YENKO RIDE`;
    }, [title]);
};

export default usePageTitle;
