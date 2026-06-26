import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { Camera, X, Upload, MapPin, CheckCircle } from "lucide-react";

const issueTypes = [
  { label: "Knocked Pole", value: "knocked-pole" },
  { label: "Road Construction Damage", value: "road-damage" },
  { label: "Cable Cut / Vandalism", value: "cable-cut" },
  { label: "No Signal", value: "no-signal" },
  { label: "Flooding / Water Damage", value: "flooding" },
  { label: "Other", value: "other" },
];

export function ReportIssue() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [issueType, setIssueType] = useState("knocked-pole");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setPhotos(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navigate("/ticket/3021"), 2000);
  };

  if (submitted) {
    return (
      <Layout showBack backTo="/dashboard" title="Report Issue">
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border-2 border-[#BBF7D0] flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-[#16A34A]" />
          </div>
          <h2
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-xl mb-2"
          >
            Report Submitted!
          </h2>
          <p className="text-[#64748B] text-sm">Your photos and details are being reviewed by our team. You'll receive an update shortly.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBack backTo="/dashboard" title="Report Issue">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
            className="text-[#0F172A] text-2xl"
          >
            Report an Issue
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Photos help us respond faster</p>
        </div>

        {/* Issue type */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">Issue Type</p>
          <div className="grid grid-cols-2 gap-2">
            {issueTypes.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setIssueType(value)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  issueType === value
                    ? "border-[#0057B8] bg-[#EBF2FF] text-[#0057B8]"
                    : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">
            Attach Photos{" "}
            <span className="text-[#94A3B8] font-normal">(up to 5)</span>
          </p>

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {photos.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E2E8F0]">
                  <img src={src} alt="Upload" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {photos.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#0057B8] hover:bg-[#EBF2FF]/30 transition-colors"
            >
              <Camera size={24} className="text-[#94A3B8]" />
              <p className="text-[#64748B] text-sm font-medium">Tap to add photos</p>
              <p className="text-[#94A3B8] text-xs">Knocked poles, road damage, cable issues</p>
            </button>
          )}

          <div className="mt-2 bg-[#EBF2FF] border border-[#BFDBFE] rounded-xl p-3 flex items-start gap-2">
            <Upload size={12} className="text-[#0057B8] mt-0.5 shrink-0" />
            <p className="text-[#1D4ED8] text-xs">
              Photos go to our admin team for verification before a field crew is dispatched.
            </p>
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">Your Location</p>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
            <MapPin size={16} className="text-[#0057B8] shrink-0" />
            <div className="flex-1">
              <p className="text-[#0F172A] text-sm font-medium">Ntinda, Kampala</p>
              <p className="text-[#94A3B8] text-xs">Auto-detected from account</p>
            </div>
            <button className="text-[#0057B8] text-xs font-medium">Change</button>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[#0F172A] text-sm font-semibold mb-2">Description</p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what you see, e.g. 'Pole knocked down by truck on Ntinda road near Total station'"
            className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-[#0057B8] hover:bg-[#003D82] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Submit Report
        </button>
      </div>
    </Layout>
  );
}
