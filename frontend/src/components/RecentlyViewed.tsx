import { usePGlite } from "@electric-sql/pglite-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLastViewedContentDetails, type LastViewedContentDetails } from "../db/crud/read/localstorage";
import { FiClock, FiMusic, FiBookOpen, FiExternalLink } from "react-icons/fi";
import { ContentType } from "@/db/models";

interface RecentlyViewedProps {
  contentIds: string[];
}

export default function RecentlyViewed({ contentIds }: RecentlyViewedProps) {
  const db = usePGlite();
  const navigate = useNavigate();
  const [recentContent, setRecentContent] = useState<LastViewedContentDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentContent = async () => {
      if (!db || contentIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const contentDetails: LastViewedContentDetails[] = [];

        // Fetch details for each content ID (in reverse order - most recent first)
        for (const contentId of [...contentIds].reverse()) {
          const details = await getLastViewedContentDetails(db, contentId);
          if (details) {
            contentDetails.push(details);
          }
        }

        setRecentContent(contentDetails);
      } catch (error) {
        console.error("Failed to fetch recently viewed content:", error);
        setRecentContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentContent();
  }, [db, contentIds]);

  const handleContentClick = (content: LastViewedContentDetails) => {
    navigate(`/presentation/${content.id}`);
  };

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
      ) : recentContent.length === 0 ? (
        <div className="card bg-base-200 shadow-sm" dir="rtl">
          <div className="card-body text-center py-12">
            <p className="text-base-content/60">لا توجد مشاهدات سابقة</p>
          </div>
        </div>
      ) : (
        <div className="pb-4 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-52 lg:max-h-82 overflow-auto">
          {recentContent.map((content) => (
            <div
              key={content.id}
              onClick={() => handleContentClick(content)}
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
                  <FiExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
