import { FiFacebook } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="footer footer-horizontal footer-center bg-neutral text-neutral-content p-10">
      <aside className="gap-4">
        <span className="font-bold text-lg lg:text-xl text-shadow-lg">ϩⲩⲙⲛⲟⲥ</span>
        <div>
          <p className="font-bold font-amiri">"سَبْعَ مَرَّاتٍ فِي النَّهَارِ سَبَّحْتُكَ عَلَى أَحْكَامِ عَدْلِكَ."</p>
          <span className="font-bold font-amiri">(مز ١١٩: ١٦٤)</span>
        </div>
        <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
      </aside>
      {/* <nav>
        <div className="grid grid-flow-col gap-4">
          <a>
            <FiFacebook className="w-8 h-8" />
          </a>
        </div>
      </nav> */}
    </footer>
  );
}
