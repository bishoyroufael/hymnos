import { usePGlite } from "@electric-sql/pglite-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLastViewedContentDetails, type LastViewedContentDetails } from "../db/crud/read/localstorage";
import { FiClock, FiMusic, FiBookOpen, FiExternalLink } from "react-icons/fi";
import { ContentType } from "@/db/models";
import { enterPresentationMode } from "@/utils/fullscreen";

interface RecentlyViewedProps {
  contentIds: string[];
}

export default function RecentlyViewed({ contentIds }: RecentlyViewedProps) {
  const db = usePGlite();
  // null = not loaded yet; loading state is derived instead of set in the effect.
  const [recentContent, setRecentContent] = useState<LastViewedContentDetails[] | null>(null);
  const isLoading = recentContent === null && contentIds.length > 0;
  const items = recentContent ?? [];

  useEffect(() => {
    if (!db || contentIds.length === 0) return;

    let cancelled = false;
    // Fetch all details concurrently (most recent first); order is preserved.
    Promise.all([...contentIds].reverse().map((contentId) => getLastViewedContentDetails(db, contentId)))
      .then((details) => {
        if (!cancelled) setRecentContent(details.filter((d): d is LastViewedContentDetails => d !== null));
      })
      .catch((error) => {
        console.error("Failed to fetch recently viewed content:", error);
        if (!cancelled) setRecentContent([]);
      });

    return () => {
      cancelled = true;
    };
  }, [db, contentIds]);

  const getContentIcon = (contentType: ContentType) => {
    switch (contentType) {
      case ContentType.hymn:
        return <FiMusic className="w-4 h-4" />;
      case ContentType.bible_chapter:
        return <FiBookOpen className="w-4 h-4" />;
      default:
        return <FiBookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Section Header */}
      <div className="flex items-center gap-2" dir="rtl">
        <FiClock className="w-4 h-4 text-base-content/70" />
        <h2 className="text-xl font-bold text-base-content">شاهدته مؤخراً</h2>
      </div>

      {/* Content Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-box"></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card bg-base-200 shadow-sm" dir="rtl">
          <div className="card-body text-center py-12">
            <p className="text-base-content/60">لا توجد مشاهدات سابقة</p>
          </div>
        </div>
      ) : (
        <div className="pb-4 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-52 lg:max-h-82 overflow-auto">
          {items.map((content) => (
            <Link
              key={content.id}
              to={`/presentation/${content.id}`}
              onClick={() => void enterPresentationMode()}
              className="card bg-base-200 hover:bg-base-300 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="card-body p-4" dir="rtl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-base-content/40 group-hover:text-primary transition-colors">{getContentIcon(content.contentType)}</div>
                      <h3 className="card-title text-base group-hover:text-primary transition-colors font-semibold text-base-content line-clamp-1">
                        {content.name}
                      </h3>
                    </div>
                    <p className="text-xs lg:text-sm text-base-content/70 group-hover:text-primary/70 transition-colors line-clamp-2">
                      {content.description}
                    </p>
                  </div>
                  <FiExternalLink aria-hidden className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
