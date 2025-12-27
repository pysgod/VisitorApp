const axios = require('axios');
const FormData = require('form-data');

// Plate Recognizer API - Ücretsiz tier: 2500 istek/ay
// https://platerecognizer.com/
const PLATE_RECOGNIZER_TOKEN = process.env.PLATE_RECOGNIZER_TOKEN;

// @desc    Fotoğraftan plaka tanıma
// @route   POST /api/ocr/plate
exports.recognizePlate = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Fotoğraf URL\'i gerekli'
      });
    }
    
    // Plate Recognizer API'yi kullan
    if (!PLATE_RECOGNIZER_TOKEN) {
      // Token yoksa boş döndür (özellik devre dışı)
      return res.status(200).json({
        success: true,
        plate: null,
        message: 'OCR servisi yapılandırılmamış'
      });
    }
    
    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      { upload_url: imageUrl },
      {
        headers: {
          'Authorization': `Token ${PLATE_RECOGNIZER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Plaka sonuçlarını al
    const results = response.data.results;
    
    if (results && results.length > 0) {
      // En yüksek skor ile plaka
      const bestResult = results[0];
      const plate = bestResult.plate?.toUpperCase() || null;
      
      return res.status(200).json({
        success: true,
        plate: plate,
        confidence: bestResult.score,
        region: bestResult.region?.code || 'unknown'
      });
    }
    
    res.status(200).json({
      success: true,
      plate: null,
      message: 'Plaka bulunamadı'
    });
    
  } catch (error) {
    console.error('OCR Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Plaka tanıma hatası',
      error: error.message
    });
  }
};
