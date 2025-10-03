import AdSense from './AdSense';

export default function LeaderboardAd() {
  return (
    <div className="bg-gray-50 border-y border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Advertisement</span>
        </div>
        <div className="flex justify-center">
          <AdSense
            adSlot="1234567890"
            adFormat="horizontal"
            className="max-w-[970px] min-h-[90px]"
          />
        </div>
      </div>
    </div>
  );
}
