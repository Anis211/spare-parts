const mockDb = {
  ELH4364: {
    partName: "Фильтр масляный вставка",
    brand: "MECAFILTER",
    guid: "NSIN0020262380",
    stockQuantity: 21,
    place: "U21",
  },
  "LO-1106": {
    partName: "Фильтр масляный (картридж)",
    brand: "LYNXauto",
    guid: "NSIN0018631082",
    stockQuantity: 23,
    place: "U12",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const { partNumber } = req.query;

    if (!partNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing partNumber parameter",
      });
    }

    if (mockDb[partNumber]) {
      return res.status(200).json({
        part: mockDb[partNumber],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "PartNumber not found in mock database",
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }
}
