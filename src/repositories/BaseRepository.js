export default class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async find(query = {}, options = {}) {
    return this.model.find(query, null, options);
  }

  async findOne(query = {}) {
    return this.model.findOne(query);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async create(data, options = {}) {
    const doc = new this.model(data);
    return doc.save(options);
  }

  async updateOne(query, update, options = {}) {
    return this.model.updateOne(query, update, options);
  }

  async updateMany(query, update, options = {}) {
    return this.model.updateMany(query, update, options);
  }

  async deleteOne(query) {
    return this.model.deleteOne(query);
  }

  async deleteMany(query) {
    return this.model.deleteMany(query);
  }

  async countDocuments(query = {}) {
    return this.model.countDocuments(query);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}
