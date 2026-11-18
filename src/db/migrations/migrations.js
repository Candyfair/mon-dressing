import journal from './meta/_journal.json';
import m0000 from './0000_initial.sql';
import m0001 from './0001_rotation_pace.sql';
import m0002 from './0002_merge_evening_occasion.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  