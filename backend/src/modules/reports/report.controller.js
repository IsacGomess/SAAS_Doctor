const reportsService = require('./report.service.js');

class ReportsController {
    async getAppointmentsMonthly(req, res, next) {
        try {
            // Segurança robusta: clinicaId extraído do cookie de autenticação criptografado
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const data = await reportsService.getAppointmentsMonthly(clinicaId);
            return res.json(data);
        } catch (error) {
            next(error); // Encaminha o erro para o seu middleware de tratamento global de erros
        }
    }

    async getPatientsGrowth(req, res, next) {
        try {
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const data = await reportsService.getPatientsGrowth(clinicaId);
            return res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getWaitTimeMonthly(req, res, next) {
        try {
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const data = await reportsService.getWaitTimeMonthly(clinicaId);
            return res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getPlansMonthly(req, res, next) {
        try {
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const data = await reportsService.getPlansMonthly(clinicaId);
            return res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getDashboardSummary(req, res, next) {
        try {
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const data = await reportsService.getDashboardSummary(clinicaId);
            return res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getPlansWeekly(req, res, next) {
        try {
            const { clinicaId, role } = req.user;
            if (!clinicaId) return res.status(400).json({ message: 'Clínica não associada ao usuário.' });
            if (role !== 'administrador') return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar estatísticas.' });

            const limit = parseInt(req.query.limit, 10) || 5;
            const data = await reportsService.getPlansWeekly(clinicaId, limit);
            return res.json(data);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReportsController();