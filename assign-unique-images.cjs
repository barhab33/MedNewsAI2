// Assign images using Supabase client - no password needed!
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available
  }
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_BOLTDATABASE_URL;
const supabaseKey = process.env.VITE_BOLTDATABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing database credentials!');
  console.error('VITE_BOLTDATABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('VITE_BOLTDATABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const UNIQUE_MEDICAL_IMAGES = [
  'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460352/pexels-photo-8460352.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/6129237/pexels-photo-6129237.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460382/pexels-photo-8460382.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460419/pexels-photo-8460419.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3861458/pexels-photo-3861458.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3912979/pexels-photo-3912979.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3912980/pexels-photo-3912980.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5726837/pexels-photo-5726837.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089093/pexels-photo-7089093.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460358/pexels-photo-8460358.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089178/pexels-photo-7089178.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089285/pexels-photo-7089285.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460333/pexels-photo-8460333.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089397/pexels-photo-7089397.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460168/pexels-photo-8460168.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089385/pexels-photo-7089385.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4167542/pexels-photo-4167542.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460212/pexels-photo-8460212.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089327/pexels-photo-7089327.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386470/pexels-photo-4386470.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460346/pexels-photo-8460346.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089404/pexels-photo-7089404.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386442/pexels-photo-4386442.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088398/pexels-photo-7088398.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460196/pexels-photo-8460196.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089239/pexels-photo-7089239.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460380/pexels-photo-8460380.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088401/pexels-photo-7088401.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460324/pexels-photo-8460324.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7089244/pexels-photo-7089244.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3952231/pexels-photo-3952231.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088523/pexels-photo-7088523.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460209/pexels-photo-8460209.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088528/pexels-photo-7088528.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460335/pexels-photo-8460335.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088383/pexels-photo-7088383.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3952074/pexels-photo-3952074.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088395/pexels-photo-7088395.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386443/pexels-photo-4386443.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460166/pexels-photo-8460166.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088524/pexels-photo-7088524.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386441/pexels-photo-4386441.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088527/pexels-photo-7088527.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460323/pexels-photo-8460323.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4386468/pexels-photo-4386468.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7088525/pexels-photo-7088525.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8460325/pexels-photo-8460325.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5863382/pexels-photo-5863382.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4047146/pexels-photo-4047146.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=800'
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function main() {
  console.log('🎨 Assigning Unique Images to All Articles\n');

  const { data: articles, error } = await supabase
    .from('medical_news')
    .select('id, title')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${articles.length} articles\n`);

  if (articles.length > UNIQUE_MEDICAL_IMAGES.length) {
    console.log(`⚠️  Warning: ${articles.length} articles but only ${UNIQUE_MEDICAL_IMAGES.length} unique images`);
    console.log(`   Will reuse some images to cover all articles\n`);
  }

  const shuffledImages = shuffleArray(UNIQUE_MEDICAL_IMAGES);
  let updated = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const imageUrl = shuffledImages[i % shuffledImages.length];

    const { error: updateError } = await supabase
      .from('medical_news')
      .update({ image_url: imageUrl })
      .eq('id', article.id);

    if (!updateError) {
      console.log(`${i + 1}. ${article.title.substring(0, 60)}...`);
      console.log(`   → ${imageUrl.split('/')[5].substring(0, 30)}`);
      updated++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} articles with unique images`);
}

main().catch(console.error);
