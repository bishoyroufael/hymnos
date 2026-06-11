import SearchBar from "../components/SearchBar";
import RecentlyViewed from "../components/RecentlyViewed";
import type { SearchResultsItem } from "../db/utils/search";
import { useNavigate } from "react-router-dom";
import useHymnosStore from "../store";
import FABCreate from "@/components/base/FAB";
import { ContentType } from "../db/models";
import { enterPresentationMode } from "@/utils/fullscreen";

export default function HomePage() {
  const navigate = useNavigate();
  const lastViewedContent = useHymnosStore((state) => state.lastViewedContent);

  const handleSelectResult = (item: SearchResultsItem) => {
    if (item._resource_type === ContentType.book) {
      navigate(`/book/${item._resource_uuid}`);
      return;
    }
    // Heading to the presentation page: request fullscreen inside the click.
    void enterPresentationMode();
    if (item._slide_uuid) {
      navigate(`/presentation/${item._resource_uuid}?startSlide=${item._slide_uuid}`);
    } else {
      navigate(`/presentation/${item._resource_uuid}`);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <FABCreate />
      <div className="w-full px-4 flex flex-col gap-10">
        {/* Enhanced Hero Section with Background Image */}
        <div className="relative rounded-3xl shadow-2xl flex flex-col gap-6 lg:gap-12 p-8 md:p-26 lg:p-32">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-cover bg-start rounded-box" style={{ backgroundImage: "url('/hero.jpg')" }}></div>

          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-linear-to-br from-transparent via-base-100/80 to-transparent rounded-box"></div>

          {/* Hero Text */}
          <div className="text-center flex flex-col gap-2 lg:gap-6 fade-in-bottom">
            <h1 className="text-2xl md:text-4xl lg:text-6xl stroke-3 stroke-base-content font-extrabold drop-shadow-2xl text-shadow-lg text-base-content">
              أهلاً بك في هيمنوس
              <sup className="text-2xl align-super">
                <a href="#footnote-1" className="underline text-blue-800/80 text-[8px]">
                  1
                </a>
              </sup>
            </h1>
            <p className="text-xs lg:text-lg text-base-content/70 mx-auto font-medium drop-shadow-lg">
              مكتبة شاملة لعرض الكتاب المقدس، كتب الليتورجيا الكنسية، والترانيم
            </p>
          </div>
          {/* Search Bar */}
          <div className="fade-in-bottom z-20">
            <SearchBar onSelectResult={handleSelectResult} className="w-full" />
          </div>
        </div>

        <div className="fade-in-bottom delay-200">
          <RecentlyViewed contentIds={lastViewedContent} />
        </div>

        {/* Footnotes Section */}
        <div className="border-t border-base-300 pt-8 mt-8 fade-in-bottom delay-400">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide" dir="rtl">
              هوامش
            </h3>
            <div className="space-y-3 text-sm text-base-content/70" dir="rtl">
              <div id="footnote-1" className="flex gap-3 scroll-mt-24">
                <span className="text-primary font-medium">1.</span>
                <p>
                  <strong className="text-base-content">هيمنوس (ϩⲩⲙⲛⲟⲥ)</strong> - كلمة قبطية تعني "ترنيمة" أو "تسبحة". اشتُقت من الكلمة اليونانية
                  القديمة
                  <span dir="ltr" className="font-mono italic">
                    (ὕμνος)
                  </span>
                  والتي تعني أنشودة تسبيح أو صلاة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
