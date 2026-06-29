const { pool } = require('../config/db');
const { findAlternatives } = require('../services/groq.service');

/**
 * GET /api/chemist/inventory
 * Get full inventory for logged-in chemist
 */
const getInventory = async (req, res) => {
  try {
    const chemistId = req.user.id;
    const { search } = req.query;

    let query = `
      SELECT * FROM inventory 
      WHERE chemist_id = $1
    `;
    const params = [chemistId];

    if (search) {
      query += ` AND (LOWER(medicine_name) LIKE LOWER($2) OR LOWER(generic_name) LIKE LOWER($2) OR LOWER(ingredients) LIKE LOWER($2))`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY medicine_name ASC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
    });
  }
};

/**
 * POST /api/chemist/inventory
 * Add a medicine to inventory
 */
const addInventoryItem = async (req, res) => {
  try {
    const chemistId = req.user.id;
    const {
      medicine_name,
      generic_name,
      ingredients,
      category,
      quantity,
      unit,
      price,
      expiry_date,
      manufacturer,
    } = req.body;

    if (!medicine_name) {
      return res.status(400).json({
        success: false,
        message: 'medicine_name is required',
      });
    }

    const result = await pool.query(
      `INSERT INTO inventory 
       (chemist_id, medicine_name, generic_name, ingredients, category, quantity, unit, price, expiry_date, manufacturer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        chemistId,
        medicine_name.trim(),
        generic_name || null,
        ingredients || null,
        category || null,
        quantity || 0,
        unit || 'tablets',
        price || 0,
        expiry_date || null,
        manufacturer || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Medicine added to inventory',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Medicine already exists in inventory. Use update instead.',
      });
    }
    console.error('Add inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add medicine to inventory',
    });
  }
};

/**
 * PUT /api/chemist/inventory/:id
 * Update an inventory item
 */
const updateInventoryItem = async (req, res) => {
  try {
    const chemistId = req.user.id;
    const { id } = req.params;
    const {
      medicine_name,
      generic_name,
      ingredients,
      category,
      quantity,
      unit,
      price,
      expiry_date,
      manufacturer,
    } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET
        medicine_name = COALESCE($1, medicine_name),
        generic_name = COALESCE($2, generic_name),
        ingredients = COALESCE($3, ingredients),
        category = COALESCE($4, category),
        quantity = COALESCE($5, quantity),
        unit = COALESCE($6, unit),
        price = COALESCE($7, price),
        expiry_date = COALESCE($8, expiry_date),
        manufacturer = COALESCE($9, manufacturer),
        updated_at = NOW()
       WHERE id = $10 AND chemist_id = $11
       RETURNING *`,
      [
        medicine_name,
        generic_name,
        ingredients,
        category,
        quantity,
        unit,
        price,
        expiry_date,
        manufacturer,
        id,
        chemistId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
    });
  }
};

/**
 * DELETE /api/chemist/inventory/:id
 * Remove a medicine from inventory
 */
const deleteInventoryItem = async (req, res) => {
  try {
    const chemistId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM inventory WHERE id = $1 AND chemist_id = $2 RETURNING id',
      [id, chemistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medicine removed from inventory',
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
    });
  }
};

/**
 * POST /api/chemist/check-availability
 * Check if prescribed medicines are in inventory
 * Find Groq-powered alternatives for unavailable medicines
 */
const checkAvailability = async (req, res) => {
  try {
    const chemistId = req.user.id;
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'medicines array is required',
      });
    }

    // Get chemist's full inventory
    const inventoryResult = await pool.query(
      'SELECT * FROM inventory WHERE chemist_id = $1 AND quantity > 0 ORDER BY medicine_name',
      [chemistId]
    );
    const inventory = inventoryResult.rows;

    // Check each medicine
    const availabilityResults = await Promise.all(
      medicines.map(async (medicine) => {
        const medicineName = medicine.name || medicine;

        // Check exact or partial match in inventory
        const match = inventory.find(
          (item) =>
            item.medicine_name.toLowerCase() === medicineName.toLowerCase() ||
            item.medicine_name.toLowerCase().includes(medicineName.toLowerCase()) ||
            medicineName.toLowerCase().includes(item.medicine_name.toLowerCase()) ||
            (item.generic_name &&
              item.generic_name.toLowerCase().includes(medicineName.toLowerCase()))
        );

        if (match) {
          return {
            medicine_name: medicineName,
            available: true,
            inventory_item: match,
            alternatives: [],
          };
        }

        // Not available — find alternatives using Groq
        let alternatives = [];
        try {
          alternatives = await findAlternatives(
            medicineName,
            medicine.ingredients || '',
            inventory
          );
        } catch (altError) {
          console.error('Find alternatives error:', altError.message);
        }

        return {
          medicine_name: medicineName,
          available: false,
          inventory_item: null,
          alternatives,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: availabilityResults,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check availability',
    });
  }
};

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  checkAvailability,
};
