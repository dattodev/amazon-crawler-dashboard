const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://localhost:27017/dashboard';

// MongoDB connection with better error handling
mongoose
	.connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		maxPoolSize: 10,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	})
	.then(() => console.log('✅ Connected to MongoDB'))
	.catch((err) => {
		console.error('❌ MongoDB connection error:', err);
		process.exit(1);
	});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || '*',
		credentials: true,
	})
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/dashboard', express.static(path.join(__dirname, 'src/view')));

// Routes
const productRoutes = require('./src/routes/product.routes');
const searchUrlRoutes = require('./src/routes/searchUrl.routes');
const crawlerIntegrationRoutes = require('./src/routes/crawlerIntegration.routes');
const referralFeeRuleRoutes = require('./src/routes/referralFeeRule.routes');
const fbaFeeRuleRoutes = require('./src/routes/fbaFeeRule.routes');
const sizeTierRuleRoutes = require('./src/routes/sizeTierRule.routes');
const filterTemplateRoutes = require('./src/routes/filterTemplate.routes');
app.use('/api', productRoutes);
app.use('/api/search-urls', searchUrlRoutes);
app.use('/api/crawler', crawlerIntegrationRoutes);
app.use('/api', referralFeeRuleRoutes);
app.use('/api', fbaFeeRuleRoutes);
app.use('/api/size-tier-rules', sizeTierRuleRoutes);
app.use('/api/filter-templates', filterTemplateRoutes);

// Health check endpoint
app.get('/', (req, res) => {
	res.json({
		message: 'Amazon Product Dashboard API',
		status: 'running',
		version: '1.0.0',
		timestamp: new Date().toISOString(),
	});
});

// Config endpoint
app.get('/api/config', (req, res) => {
	res.json({
		API_BASE_URL: process.env.API_BASE_URL || '',
		CRAWLER_API_ENDPOINT: process.env.CRAWLER_API_ENDPOINT || '',
		ENVIRONMENT: process.env.NODE_ENV || 'development',
	});
});

// Global error handler
app.use((err, req, res, next) => {
	console.error('Global error handler:', err);
	res.status(500).json({
		error: 'Internal Server Error',
		message:
			process.env.NODE_ENV === 'development'
				? err.message
				: 'Something went wrong',
	});
});

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.originalUrl} not found`,
	});
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	mongoose.connection.close(() => {
		console.log('MongoDB connection closed');
		process.exit(0);
	});
});

app.listen(port, async () => {
	console.log(`🚀 API server listening at http://localhost:${port}`);
	console.log(`📊 Dashboard available at http://localhost:${port}/dashboard`);
});
