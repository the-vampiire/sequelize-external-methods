module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    'Student',
    {
      email: {
        allowNull: false,
        type: DataTypes.STRING,
        validation: { isEmail: true },
      },

      first_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      last_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      company: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.STRING,
      },
    },
  );

  Student.associate = (models) => {
    // associations
  };

  // no external methods 
  
  return Student;
};
