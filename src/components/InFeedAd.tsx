import AdSense from './AdSense';

export default function InFeedAd() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-4">
      <div className="text-center mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Advertisement</span>
      </div>
      <div className="flex justify-center items-center min-h-[250px]">
        <AdSense
          adSlot="0987654321"
          adFormat="fluid"
          style={{ minHeight: '250px' }}
        />
      </div>
    </div>
  );
}
