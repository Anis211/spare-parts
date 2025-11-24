const mockDb = {
  "1N4AL3AP1JC123456": {
    "Brake Pad Front": "41060-3JA0A",
    "Brake Pad Rear": "43060-3JA0A",
    "Air Filter": "16546-3JA0A",
    "Oil Filter": "15208-3JA0A",
    "Cabin Air Filter": "27277-3JA0A",
  },
  "5YJ3E1EA7KF000001": {
    "Tie Rod": "CRG-32",
    "Oil Filter": "ELH4364",
    "Main Radiator": "45111-SG000",
    "Wiper Blade Front": "1010240-00-D",
  },
  WBA8E1C56GNT12345: {
    "Brake Pad Front": "34116791193",
    "Oil Filter": "11427987859",
    "Air Filter": "13717593720",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const { vin } = req.query;

    if (!vin) {
      return res.status(400).json({
        success: false,
        message: "Missing vin parameter",
      });
    }

    if (mockDb[vin]) {
      return res.status(200).json({
        success: true,
        vin,
        data: mockDb[vin],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "VIN not found in mock database",
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET.",
    });
  }
}
